// Services/Interfaces/IKSeFInvoiceQueryService.cs
using KSeF.Backend.Models.Requests;
using KSeF.Backend.Models.Responses.Invoice;
using InvoiceModel = KSeF.Backend.Models.Data.Invoice;

namespace KSeF.Backend.Services.Interfaces.KSeF;

public interface IKSeFInvoiceQueryService
{
    Task<InvoiceQueryResponse> QueryInvoicesAsync(
        InvoiceQueryRequest request,
        CancellationToken cancellationToken = default);

    Task<List<InvoiceModel>> GetCachedInvoicesAsync(int companyProfileId);
}
