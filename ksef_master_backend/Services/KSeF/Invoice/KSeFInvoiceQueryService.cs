// Services/KSeF/Invoice/KSeFInvoiceQueryService.cs
using System.Text;
using System.Text.Json;
using KSeF.Backend.Infrastructure.KSeF;
using KSeF.Backend.Models.Requests;
using KSeF.Backend.Models.Responses.Invoice;
using KSeF.Backend.Repositories;
using KSeF.Backend.Services.Interfaces.KSeF;
using KSeF.Backend.Services.KSeF.Session;

namespace KSeF.Backend.Services.KSeF.Invoice;

public class KSeFInvoiceQueryService : IKSeFInvoiceQueryService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IKSeFEnvironmentService _environmentService;
    private readonly IKSeFAuthService _authService;
    private readonly KSeFSessionManager _session;
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly ILogger<KSeFInvoiceQueryService> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    public KSeFInvoiceQueryService(
        IHttpClientFactory httpClientFactory,
        IKSeFEnvironmentService environmentService,
        IKSeFAuthService authService,
        KSeFSessionManager session,
        IInvoiceRepository invoiceRepository,
        ILogger<KSeFInvoiceQueryService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _environmentService = environmentService;
        _authService = authService;
        _session = session;
        _invoiceRepository = invoiceRepository;
        _logger = logger;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        };
    }

    public async Task<List<Models.Data.Invoice>> GetCachedInvoicesAsync(int companyProfileId)
    {
        return await _invoiceRepository.GetByCompanyProfileIdAsync(companyProfileId);
    }

    public async Task<List<Models.Data.Invoice>> GetCachedInvoicesAsync(int companyProfileId, InvoiceQueryRequest filter)
    {
        var invoices = await _invoiceRepository.GetByCompanyProfileIdAsync(companyProfileId);

        var direction = filter.SubjectType == "Subject2" ? "received" : "issued";
        var from = filter.DateRange.From;
        var to = filter.DateRange.To;

        return invoices
            .Where(i => i.Direction == direction)
            .Where(i => !i.InvoiceDate.HasValue || (i.InvoiceDate.Value >= from && i.InvoiceDate.Value <= to))
            .ToList();
    }

    public async Task<InvoiceQueryResponse> QueryInvoicesAsync(
        InvoiceQueryRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!_session.IsAuthenticated)
            throw new UnauthorizedAccessException("Nie jesteś zalogowany do KSeF");

        await _authService.RefreshTokenIfNeededAsync(cancellationToken);

        var httpClient = _httpClientFactory.CreateClient("KSeF");
        var environment = _session.Environment
            ?? throw new InvalidOperationException("Brak środowiska dla aktywnej sesji KSeF");
        httpClient.BaseAddress = new Uri(_environmentService.GetApiBaseUrl(environment));
        var allInvoices = new List<InvoiceMetadata>();
        var seenIds = new HashSet<string>(StringComparer.Ordinal);
        var maxResults = request.MaxResults ?? 9900;
        var sortOrder = request.SortDescending ? "Desc" : "Asc";
        var pageOffset = 0;
        var pageSize = Math.Clamp(request.PageSize ?? 250, 10, 250);
        const int maxApiResults = 10_000;
        var hasMore = true;
        var iteration = 0;
        const int maxIterations = 200;
        DateTime? permanentStorageHwmDate = null;
        var currentFrom = request.DateRange!.From.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ");
        var currentTo = request.DateRange.To.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ");

        _logger.LogInformation(
            "Pobieranie faktur (SubjectType: {Type}, dateType: {DateType}, od: {From}, do: {To})",
            request.SubjectType, request.DateRange.DateType, currentFrom, currentTo);

        while (hasMore && iteration < maxIterations && allInvoices.Count < maxResults)
        {
            iteration++;

            var requestBody = new Dictionary<string, object?>
            {
                ["subjectType"] = request.SubjectType,
                ["dateRange"] = new
                {
                    dateType = request.DateRange.DateType,
                    from = currentFrom,
                    to = currentTo
                }
            };

            if (request.AmountFrom.HasValue || request.AmountTo.HasValue)
            {
                requestBody["amount"] = new
                {
                    type = "Brutto",
                    from = request.AmountFrom,
                    to = request.AmountTo
                };
            }

            var contractorNip = request.ContractorNip?.Trim();
            if (!string.IsNullOrEmpty(contractorNip))
            {
                if (request.SubjectType == "Subject1")
                    requestBody["buyerIdentifier"] = new { type = "Nip", value = contractorNip };
                else
                    requestBody["sellerNip"] = contractorNip;
            }

            if (!string.IsNullOrWhiteSpace(request.InvoiceNumber))
                requestBody["invoiceNumber"] = request.InvoiceNumber.Trim();

            if (!string.IsNullOrWhiteSpace(request.Currency))
                requestBody["currencyCodes"] = new[] { request.Currency.Trim().ToUpperInvariant() };

            var requestBodyJson = JsonSerializer.Serialize(requestBody, _jsonOptions);

            var url = $"invoices/query/metadata?sortOrder={sortOrder}&pageOffset={pageOffset}&pageSize={pageSize}";

            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, url);
            httpRequest.Headers.Add("Authorization", $"Bearer {_session.AccessToken}");
            httpRequest.Content = new StringContent(requestBodyJson, Encoding.UTF8, "application/json");

            using var response = await httpClient.SendAsync(httpRequest, cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
                throw new KSeFApiException(
                    $"Pobieranie metadanych faktur nie powiodło się: {KSeFErrorParser.Parse(content)}",
                    response.StatusCode);

            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            var pageHasMore = root.TryGetProperty("hasMore", out var hasMoreEl) && hasMoreEl.GetBoolean();
            var pageIsTruncated = root.TryGetProperty("isTruncated", out var truncEl) && truncEl.GetBoolean();
            if (permanentStorageHwmDate == null &&
                root.TryGetProperty("permanentStorageHwmDate", out var hwmEl) &&
                hwmEl.ValueKind == JsonValueKind.String &&
                hwmEl.TryGetDateTime(out var hwmDate))
            {
                permanentStorageHwmDate = hwmDate;
            }
            var newCount = 0;
            var lastInvoiceDate = string.Empty;

            if (root.TryGetProperty("invoices", out var invoicesEl) && invoicesEl.ValueKind == JsonValueKind.Array)
            {
                foreach (var invEl in invoicesEl.EnumerateArray())
                {
                    var invoice = JsonSerializer.Deserialize<InvoiceMetadata>(invEl.GetRawText(), _jsonOptions);
                    if (invoice == null) continue;

                    var cursorDate = GetInvoiceDateForCursor(invoice, request.DateRange.DateType);
                    if (!string.IsNullOrEmpty(cursorDate))
                        lastInvoiceDate = cursorDate;

                    if (!seenIds.Add(invoice.KsefNumber) || !MatchesClientSideFilters(invoice, request))
                        continue;

                    allInvoices.Add(invoice);
                    newCount++;

                    if (allInvoices.Count >= maxResults)
                        break;
                }
            }

            _logger.LogInformation(
                "Iter {Iter}: +{New} faktur (łącznie: {Total}, hasMore: {HasMore}, isTruncated: {Truncated})",
                iteration, newCount, allInvoices.Count, pageHasMore, pageIsTruncated);

            if (!pageHasMore)
            {
                hasMore = false;
                break;
            }

            if (allInvoices.Count >= maxResults)
                break;

            if (pageIsTruncated || (pageOffset + 1) * pageSize >= maxApiResults)
            {
                if (string.IsNullOrEmpty(lastInvoiceDate))
                    break;

                var newCursor = NormalizeToUtcString(lastInvoiceDate);
                if (request.SortDescending)
                {
                    if (newCursor == currentTo) break;
                    currentTo = newCursor;
                }
                else
                {
                    if (newCursor == currentFrom) break;
                    currentFrom = newCursor;
                }
                pageOffset = 0;
            }
            else
            {
                pageOffset++;
            }
        }

        if (request.SortDescending)
            allInvoices = allInvoices.OrderByDescending(i => i.InvoicingDate ?? i.PermanentStorageDate ?? DateTime.MinValue).ToList();
        else
            allInvoices = allInvoices.OrderBy(i => i.InvoicingDate ?? i.PermanentStorageDate ?? DateTime.MinValue).ToList();

        _logger.LogInformation(
            "Pobieranie zakończone: {Count} faktur w {Iterations} iteracjach",
            allInvoices.Count, iteration);

        return new InvoiceQueryResponse
        {
            HasMore = hasMore,
            IsTruncated = hasMore || allInvoices.Count >= maxResults,
            PermanentStorageHwmDate = permanentStorageHwmDate,
            Invoices = allInvoices,
            TotalCount = allInvoices.Count,
            FetchedAt = DateTime.UtcNow,
            PagesProcessed = iteration
        };
    }

    private static bool MatchesClientSideFilters(InvoiceMetadata invoice, InvoiceQueryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ContractorName))
            return true;

        var contractorName = request.SubjectType == "Subject1"
            ? invoice.Buyer?.Name
            : invoice.Seller?.Name;

        return contractorName?.Contains(
            request.ContractorName.Trim(), StringComparison.OrdinalIgnoreCase) == true;
    }

    private string GetInvoiceDateForCursor(InvoiceMetadata invoice, string dateType)
    {
        return dateType switch
        {
            "Issue" => invoice.IssueDate ?? string.Empty,
            "Invoicing" => invoice.InvoicingDate?.ToString("O") ?? string.Empty,
            _ => invoice.PermanentStorageDate?.ToString("O") ?? string.Empty
        };
    }

    private static string NormalizeToUtcString(string dateString)
    {
        if (DateTimeOffset.TryParse(dateString, out var dto))
            return dto.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffffffZ");
        return dateString;
    }
}
