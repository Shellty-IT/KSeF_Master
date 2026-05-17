using KSeF.Backend.Models.Responses.Invoice;

namespace KSeF.Backend.Services.Interfaces.KSeF;

public interface IKSeFInvoiceSyncService
{
    Task<InvoiceSyncResult> SyncInvoicesAsync(
        int companyProfileId,
        string nip,
        string environment,
        string direction,
        CancellationToken cancellationToken = default);
}
