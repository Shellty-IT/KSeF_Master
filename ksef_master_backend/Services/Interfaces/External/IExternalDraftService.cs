// Services/Interfaces/External/IExternalDraftService.cs
using KSeF.Backend.Models;
using KSeF.Backend.Models.Requests;

namespace KSeF.Backend.Services.Interfaces.External;

public interface IExternalDraftService
{
    Task<ExternalDraft?> GetByIdAsync(string id, string? sellerNip = null);
    Task<ExternalDraft?> GetBySmartQuoteIdAsync(string smartQuoteId);
    Task<List<ExternalDraft>> GetAllAsync(string? statusFilter = null, string? sellerNip = null);
    Task<bool> ExistsBySmartQuoteIdAsync(string smartQuoteId);
    Task<ExternalDraft> ImportAsync(SmartQuoteImportRequest request);
    Task<ExternalDraft?> ApproveAsync(string id, string processedBy, string? sellerNip = null);
    Task<ExternalDraft?> RejectAsync(string id, string processedBy, string reason, string? sellerNip = null);
}
