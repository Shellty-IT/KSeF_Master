// Services/KSeF/Invoice/KSeFInvoiceFacade.cs
using KSeF.Backend.Models.Requests;
using KSeF.Backend.Models.Responses.Invoice;
using KSeF.Backend.Models.Responses.Stats;
using KSeF.Backend.Models.Responses.Common;
using KSeF.Backend.Services.Interfaces.KSeF;
using KSeF.Backend.Services.KSeF.Session;

namespace KSeF.Backend.Services.KSeF.Invoice;

public class KSeFInvoiceFacade : IKSeFInvoiceService
{
    private readonly IKSeFInvoiceQueryService _queryService;
    private readonly IKSeFInvoiceSyncService _syncService;
    private readonly IKSeFInvoiceDetailsService _detailsService;
    private readonly IKSeFInvoiceStatsService _statsService;
    private readonly IKSeFOnlineSessionService _sessionService;
    private readonly IKSeFInvoiceSendService _sendService;
    private readonly KSeFSessionManager _sessionManager;

    public KSeFInvoiceFacade(
        IKSeFInvoiceQueryService queryService,
        IKSeFInvoiceSyncService syncService,
        IKSeFInvoiceDetailsService detailsService,
        IKSeFInvoiceStatsService statsService,
        IKSeFOnlineSessionService sessionService,
        IKSeFInvoiceSendService sendService,
        KSeFSessionManager sessionManager)
    {
        _queryService = queryService;
        _syncService = syncService;
        _detailsService = detailsService;
        _statsService = statsService;
        _sessionService = sessionService;
        _sendService = sendService;
        _sessionManager = sessionManager;
    }

    public async Task<InvoiceQueryResponse> GetInvoicesAsync(InvoiceQueryRequest request, CancellationToken ct = default)
    {
        if (!_sessionManager.IsAuthenticated)
            throw new UnauthorizedAccessException("Brak aktywnej sesji KSeF");

        return await _queryService.QueryInvoicesAsync(request, ct);
    }

    public async Task<InvoiceSyncResult> SyncInvoicesAsync(
        int companyProfileId,
        string nip,
        string environment,
        string direction,
        CancellationToken ct = default)
    {
        if (!_sessionManager.IsAuthenticated)
            throw new UnauthorizedAccessException("Brak aktywnej sesji KSeF");

        return await _syncService.SyncInvoicesAsync(companyProfileId, nip, environment, direction, ct);
    }

    public Task<InvoiceDetailsResult> GetInvoiceDetailsAsync(string ksefNumber, CancellationToken ct = default)
        => _detailsService.GetInvoiceDetailsAsync(ksefNumber, ct);

    public Task<InvoiceStatsResponse> GetInvoiceStatsAsync(int months = 3, CancellationToken ct = default)
        => _statsService.GetStatsAsync(months, ct);

    public Task<SessionResult> OpenOnlineSessionAsync(CancellationToken ct = default)
        => _sessionService.OpenOnlineSessionAsync(ct);

    public Task<SendInvoiceResult> SendInvoiceAsync(CreateInvoiceRequest invoiceData, CancellationToken ct = default)
        => _sendService.SendInvoiceAsync(invoiceData, ct);
}
