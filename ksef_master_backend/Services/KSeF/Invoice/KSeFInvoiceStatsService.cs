using KSeF.Backend.Models.Requests;
using KSeF.Backend.Models.Responses.Invoice;
using KSeF.Backend.Models.Responses.Stats;
using KSeF.Backend.Services.Interfaces.KSeF;

namespace KSeF.Backend.Services.KSeF.Invoice;

public class KSeFInvoiceStatsService : IKSeFInvoiceStatsService
{
    private readonly IKSeFInvoiceQueryService _queryService;
    private readonly ILogger<KSeFInvoiceStatsService> _logger;

    public KSeFInvoiceStatsService(
        IKSeFInvoiceQueryService queryService,
        ILogger<KSeFInvoiceStatsService> logger)
    {
        _queryService = queryService;
        _logger = logger;
    }

    public async Task<InvoiceStatsResponse> GetStatsAsync(int months, CancellationToken cancellationToken = default)
    {
        var periodTo = DateTime.UtcNow;
        var periodFrom = periodTo.AddMonths(-months);

        _logger.LogInformation("Computing stats from {From} to {To}", periodFrom, periodTo);

        var issued = await QueryPeriodAsync("Subject1", periodFrom, periodTo, cancellationToken);
        var received = await QueryPeriodAsync("Subject2", periodFrom, periodTo, cancellationToken);

        var stats = new InvoiceStatsResponse
        {
            IssuedCount = issued.Invoices.Count,
            ReceivedCount = received.Invoices.Count,
            IssuedNetTotal = issued.Invoices.Sum(i => i.NetAmount ?? 0),
            IssuedGrossTotal = issued.Invoices.Sum(i => i.GrossAmount ?? 0),
            ReceivedNetTotal = received.Invoices.Sum(i => i.NetAmount ?? 0),
            ReceivedGrossTotal = received.Invoices.Sum(i => i.GrossAmount ?? 0),
            PeriodFrom = periodFrom,
            PeriodTo = periodTo
        };

        stats.Monthly = ComputeMonthlyStats(issued, received);
        stats.TopContractors = ComputeTopContractors(issued.Invoices, received.Invoices);
        stats.ByCurrency = ComputeCurrencyStats(issued.Invoices.Concat(received.Invoices).ToList());

        return stats;
    }

    private async Task<InvoiceQueryResponse> QueryPeriodAsync(
        string subjectType,
        DateTime periodFrom,
        DateTime periodTo,
        CancellationToken cancellationToken)
    {
        var result = new InvoiceQueryResponse();
        var seenKsefNumbers = new HashSet<string>(StringComparer.Ordinal);
        var windowFrom = periodFrom;

        while (windowFrom < periodTo)
        {
            var windowTo = windowFrom.AddMonths(3);
            if (windowTo > periodTo)
                windowTo = periodTo;

            var window = await _queryService.QueryInvoicesAsync(new InvoiceQueryRequest
            {
                SubjectType = subjectType,
                DateRange = new DateRangeFilter
                {
                    From = windowFrom,
                    To = windowTo,
                    DateType = "Invoicing"
                }
            }, cancellationToken);

            foreach (var invoice in window.Invoices)
            {
                if (seenKsefNumbers.Add(invoice.KsefNumber))
                    result.Invoices.Add(invoice);
            }

            result.PagesProcessed += window.PagesProcessed;
            result.IsTruncated |= window.IsTruncated;
            result.HasMore |= window.HasMore;
            windowFrom = windowTo;
        }

        result.TotalCount = result.Invoices.Count;
        result.FetchedAt = DateTime.UtcNow;
        return result;
    }

    private static List<MonthlyStats> ComputeMonthlyStats(
        InvoiceQueryResponse issued,
        InvoiceQueryResponse received)
    {
        var monthlyStats = new Dictionary<string, MonthlyStats>();

        foreach (var inv in issued.Invoices)
        {
            if (!inv.InvoicingDate.HasValue) continue;
            var month = inv.InvoicingDate.Value.ToString("yyyy-MM");

            if (!monthlyStats.ContainsKey(month))
                monthlyStats[month] = new MonthlyStats { Month = month };

            monthlyStats[month].IssuedCount++;
            monthlyStats[month].IssuedGross += inv.GrossAmount ?? 0;
        }

        foreach (var inv in received.Invoices)
        {
            if (!inv.InvoicingDate.HasValue) continue;
            var month = inv.InvoicingDate.Value.ToString("yyyy-MM");

            if (!monthlyStats.ContainsKey(month))
                monthlyStats[month] = new MonthlyStats { Month = month };

            monthlyStats[month].ReceivedCount++;
            monthlyStats[month].ReceivedGross += inv.GrossAmount ?? 0;
        }

        return monthlyStats.Values.OrderBy(m => m.Month).ToList();
    }

    private static Dictionary<string, int> ComputeTopContractors(
        IEnumerable<InvoiceMetadata> issuedInvoices,
        IEnumerable<InvoiceMetadata> receivedInvoices)
    {
        var contractorNames = issuedInvoices
            .Select(invoice => invoice.Buyer?.Name)
            .Concat(receivedInvoices.Select(invoice => invoice.Seller?.Name));

        return contractorNames
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .GroupBy(name => name!, StringComparer.OrdinalIgnoreCase)
            .OrderByDescending(g => g.Count())
            .Take(10)
            .ToDictionary(g => g.Key, g => g.Count());
    }

    private static Dictionary<string, CurrencyStats> ComputeCurrencyStats(List<InvoiceMetadata> invoices)
    {
        return invoices
            .Where(i => !string.IsNullOrEmpty(i.Currency))
            .GroupBy(i => i.Currency!)
            .ToDictionary(
                g => g.Key,
                g => new CurrencyStats
                {
                    Count = g.Count(),
                    NetTotal = g.Sum(i => i.NetAmount ?? 0),
                    GrossTotal = g.Sum(i => i.GrossAmount ?? 0)
                });
    }
}
