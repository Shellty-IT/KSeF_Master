using KSeF.Backend.Models.Requests;
using KSeF.Backend.Models.Responses.Invoice;
using KSeF.Backend.Repositories;
using KSeF.Backend.Services.Interfaces.KSeF;
using KSeF.Backend.Services.KSeF.Session;
using InvoiceModel = KSeF.Backend.Models.Data.Invoice;

namespace KSeF.Backend.Services.KSeF.Invoice;

public class KSeFInvoiceSyncService : IKSeFInvoiceSyncService
{
    private readonly IKSeFAuthService _authService;
    private readonly KSeFSessionManager _session;
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly IKSeFInvoiceQueryService _queryService;
    private readonly ILogger<KSeFInvoiceSyncService> _logger;

    public KSeFInvoiceSyncService(
        IKSeFAuthService authService,
        KSeFSessionManager session,
        IInvoiceRepository invoiceRepository,
        IKSeFInvoiceQueryService queryService,
        ILogger<KSeFInvoiceSyncService> logger)
    {
        _authService = authService;
        _session = session;
        _invoiceRepository = invoiceRepository;
        _queryService = queryService;
        _logger = logger;
    }

    public async Task<InvoiceSyncResult> SyncInvoicesAsync(
        int companyProfileId,
        string nip,
        string environment,
        string direction,
        CancellationToken cancellationToken = default)
    {
        if (!_session.IsAuthenticated)
            throw new UnauthorizedAccessException("Nie jesteś zalogowany do KSeF");

        await _authService.RefreshTokenIfNeededAsync(cancellationToken);

        var latestTimestamp = await _invoiceRepository.GetLatestAcquisitionTimestampAsync(companyProfileId, direction);
        var existingNumbers = await _invoiceRepository.GetExistingKsefNumbersAsync(companyProfileId);
        var existingSet = new HashSet<string>(existingNumbers);

        var subjectType = direction == "issued" ? "Subject1" : "Subject2";
        var syncFrom = latestTimestamp.HasValue
            ? latestTimestamp.Value.AddSeconds(-30)
            : DateTime.UtcNow.AddMonths(-3);
        var syncTo = DateTime.UtcNow;

        _logger.LogInformation(
            "Delta sync [{Direction}] companyProfileId={CompanyProfileId} od {From} do {To}",
            direction, companyProfileId, syncFrom, syncTo);

        var windows = BuildDateWindows(syncFrom, syncTo, months: 1);
        var invoicesToUpsert = new List<InvoiceModel>();
        var newInvoiceCount = 0;
        var totalFetched = 0;

        foreach (var (windowFrom, windowTo) in windows)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var request = new InvoiceQueryRequest
            {
                SubjectType = subjectType,
                DateRange = new DateRangeFilter
                {
                    DateType = "PermanentStorage",
                    From = windowFrom,
                    To = windowTo
                },
                SortDescending = false,
                MaxResults = 9900
            };

            var queryResult = await _queryService.QueryInvoicesAsync(request, cancellationToken);
            totalFetched += queryResult.TotalCount;

            var mappedInvoices = queryResult.Invoices
                .Select(i => MapToInvoice(i, companyProfileId, nip, direction, environment))
                .ToList();

            var windowNewCount = 0;
            foreach (var invoice in mappedInvoices)
            {
                if (existingSet.Add(invoice.KsefReferenceNumber))
                    windowNewCount++;
            }

            newInvoiceCount += windowNewCount;
            invoicesToUpsert.AddRange(mappedInvoices);

            _logger.LogInformation(
                "Okno [{From} → {To}]: +{New} nowych faktur [{Direction}]",
                windowFrom, windowTo, windowNewCount, direction);
        }

        if (invoicesToUpsert.Count > 0)
        {
            await _invoiceRepository.UpsertManyAsync(invoicesToUpsert);
            _logger.LogInformation(
                "Zsynchronizowano {Count} faktur, w tym {NewCount} nowych [{Direction}]",
                invoicesToUpsert.Count, newInvoiceCount, direction);
        }
        else
        {
            _logger.LogInformation("Brak nowych faktur [{Direction}]", direction);
        }

        return new InvoiceSyncResult
        {
            NewCount = newInvoiceCount,
            TotalFetched = totalFetched,
            SyncedAt = DateTime.UtcNow,
            Direction = direction
        };
    }

    private static List<(DateTime From, DateTime To)> BuildDateWindows(DateTime from, DateTime to, int months)
    {
        var windows = new List<(DateTime, DateTime)>();
        var current = from;

        while (current < to)
        {
            var windowEnd = current.AddMonths(months);
            if (windowEnd > to)
                windowEnd = to;

            windows.Add((current, windowEnd));
            current = windowEnd;
        }

        return windows;
    }

    private static InvoiceModel MapToInvoice(
        InvoiceMetadata metadata,
        int companyProfileId,
        string nip,
        string direction,
        string environment)
    {
        return new InvoiceModel
        {
            CompanyProfileId = companyProfileId,
            KsefReferenceNumber = metadata.KsefNumber,
            Nip = nip,
            InvoiceType = metadata.InvoiceType ?? "FA",
            Direction = direction,
            InvoiceNumber = metadata.InvoiceNumber,
            SellerNip = metadata.Seller?.Nip,
            SellerName = metadata.Seller?.Name,
            BuyerNip = metadata.Buyer?.Identifier?.Value,
            BuyerName = metadata.Buyer?.Name,
            NetAmount = metadata.NetAmount,
            VatAmount = metadata.VatAmount,
            GrossAmount = metadata.GrossAmount,
            Currency = metadata.Currency,
            InvoiceDate = ParseIssueDate(metadata.IssueDate),
            InvoicingDate = ToUtc(metadata.InvoicingDate),
            AcquisitionTimestamp = ToUtc(metadata.AcquisitionDate) ?? DateTime.UtcNow,
            PermanentStorageDate = ToUtc(metadata.PermanentStorageDate),
            SyncedAt = DateTime.UtcNow,
            InvoiceHash = metadata.InvoiceHash,
            KsefEnvironment = environment
        };
    }

    private static DateTime? ParseIssueDate(string? value)
    {
        if (!DateOnly.TryParseExact(value, "yyyy-MM-dd", out var date))
            return null;

        return DateTime.SpecifyKind(date.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
    }

    private static DateTime? ToUtc(DateTime? dt)
    {
        if (dt == null) return null;
        return dt.Value.Kind == DateTimeKind.Utc
            ? dt.Value
            : DateTime.SpecifyKind(dt.Value, DateTimeKind.Utc);
    }
}
