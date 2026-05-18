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

        var subjectType = direction == "issued" ? "subject1" : "subject2";
        var syncFrom = latestTimestamp.HasValue
            ? latestTimestamp.Value.AddSeconds(-30)
            : DateTime.UtcNow.AddMonths(-3);
        var syncTo = DateTime.UtcNow;

        _logger.LogInformation(
            "Delta sync [{Direction}] companyProfileId={CompanyProfileId} od {From} do {To}",
            direction, companyProfileId, syncFrom, syncTo);

        var windows = BuildDateWindows(syncFrom, syncTo, months: 1);
        var allNewInvoices = new List<InvoiceModel>();
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

            var newInvoices = queryResult.Invoices
                .Where(i => !existingSet.Contains(i.KsefNumber))
                .Select(i => MapToInvoice(i, companyProfileId, nip, direction, environment))
                .ToList();

            foreach (var inv in newInvoices)
                existingSet.Add(inv.KsefReferenceNumber);

            allNewInvoices.AddRange(newInvoices);

            _logger.LogInformation(
                "Okno [{From} → {To}]: +{New} nowych faktur [{Direction}]",
                windowFrom, windowTo, newInvoices.Count, direction);
        }

        if (allNewInvoices.Count > 0)
        {
            await _invoiceRepository.UpsertManyAsync(allNewInvoices);
            _logger.LogInformation(
                "Zapisano łącznie {Count} nowych faktur [{Direction}]",
                allNewInvoices.Count, direction);
        }
        else
        {
            _logger.LogInformation("Brak nowych faktur [{Direction}]", direction);
        }

        return new InvoiceSyncResult
        {
            NewCount = allNewInvoices.Count,
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
            InvoiceDate = ToUtc(metadata.InvoicingDate ?? metadata.PermanentStorageDate),
            AcquisitionTimestamp = ToUtc(metadata.AcquisitionDate) ?? DateTime.UtcNow,
            SyncedAt = DateTime.UtcNow,
            KsefEnvironment = environment
        };
    }

    private static DateTime? ToUtc(DateTime? dt)
    {
        if (dt == null) return null;
        return dt.Value.Kind == DateTimeKind.Utc
            ? dt.Value
            : DateTime.SpecifyKind(dt.Value, DateTimeKind.Utc);
    }
}
