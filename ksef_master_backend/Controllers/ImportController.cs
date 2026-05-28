// Controllers/ImportController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using KSeF.Backend.Middleware;
using KSeF.Backend.Models;
using KSeF.Backend.Models.Common;
using KSeF.Backend.Models.Data;
using KSeF.Backend.Models.Requests;
using KSeF.Backend.Services.External;
using KSeF.Backend.Services.Interfaces.External;

namespace KSeF.Backend.Controllers;

[Route("api/v1/import")]
[Produces("application/json")]
public class ImportController : BaseApiController
{
    private readonly IExternalDraftService _draftService;
    private readonly ExternalDraftValidator _validator;
    private readonly AppDbContext _db;
    private readonly ILogger<ImportController> _logger;

    public ImportController(
        IExternalDraftService draftService,
        ExternalDraftValidator validator,
        AppDbContext db,
        ILogger<ImportController> logger)
    {
        _draftService = draftService;
        _validator = validator;
        _db = db;
        _logger = logger;
    }

    [HttpGet("companies/exists")]
    [ApiKeyAuth]
    public async Task<IActionResult> CompanyExists([FromQuery] string nip)
    {
        if (string.IsNullOrWhiteSpace(nip) || nip.Length != 10 || !nip.All(char.IsDigit))
            return BadRequest(new { success = false, message = "nip musi mieć dokładnie 10 cyfr" });

        var profile = await _db.CompanyProfiles
            .Where(c => c.Nip == nip && c.IsActive)
            .Select(c => new { c.CompanyName })
            .FirstOrDefaultAsync();

        return Ok(new
        {
            success = true,
            exists = profile != null,
            companyName = profile?.CompanyName
        });
    }

    [HttpGet("drafts/by-smartquote/{smartQuoteId}")]
    [ApiKeyAuth]
    public async Task<IActionResult> GetBySmartQuoteId(string smartQuoteId)
    {
        var draft = await _draftService.GetBySmartQuoteIdAsync(smartQuoteId);
        if (draft == null)
            return NotFound(new { success = false, message = "Szkic nie znaleziony" });

        return Ok(new { success = true, draftId = draft.Id, status = draft.Status.ToString() });
    }

    [HttpPost("smartquote")]
    [ApiKeyAuth]
    public async Task<IActionResult> ImportFromSmartQuote([FromBody] SmartQuoteImportRequest request)
    {
        _logger.LogInformation(
            "SmartQuote import: SmartQuoteId={Id}, OfferNumber={Number}",
            request.SmartQuoteId, request.OfferNumber);

        var validationErrors = _validator.Validate(request);
        if (validationErrors.Count > 0)
            return BadRequest(new { success = false, message = string.Join("; ", validationErrors) });

        // Optimistic path: no pre-check. Let the DB unique index catch true duplicates.
        // DuplicateSmartQuoteIdException is thrown when SaveChanges hits the unique constraint
        // (fixes race condition where two simultaneous requests both pass a pre-check).
        try
        {
            var draft = await _draftService.ImportAsync(request);

            _logger.LogInformation(
                "Draft created: {DraftId} for SmartQuoteId: {SmartQuoteId}",
                draft.Id, draft.SmartQuoteId);

            return StatusCode(201, new
            {
                success = true,
                draftId = draft.Id,
                message = "Szkic faktury przyjęty do poczekalni"
            });
        }
        catch (DuplicateSmartQuoteIdException ex)
        {
            return Conflict(new { success = false, draftId = ex.ExistingDraftId, message = "Szkic z tym smartQuoteId już istnieje" });
        }
    }

    [HttpGet("drafts")]
    [Authorize]
    public async Task<IActionResult> GetDrafts([FromQuery] string? status = null)
    {
        var nip = await GetCurrentUserNipAsync();
        if (nip == null)
            return Unauthorized(ApiResponse<object?>.Fail("Brak profilu firmy"));

        var drafts = await _draftService.GetAllAsync(status, nip);
        Response.Headers["X-Total-Count"] = drafts.Count.ToString();
        return Ok(ApiResponse<List<ExternalDraft>>.Ok(drafts));
    }

    [HttpGet("drafts/{id}")]
    [Authorize]
    public async Task<IActionResult> GetDraft(string id)
    {
        var nip = await GetCurrentUserNipAsync();
        if (nip == null)
            return Unauthorized(ApiResponse<object?>.Fail("Brak profilu firmy"));

        var draft = await _draftService.GetByIdAsync(id, nip);

        if (draft == null)
            return NotFound(ApiResponse<object?>.Fail("Szkic nie znaleziony"));

        return Ok(ApiResponse<object>.Ok(draft));
    }

    [HttpPost("drafts/{id}/approve")]
    [Authorize]
    public async Task<IActionResult> ApproveDraft(string id)
    {
        var (nip, processedBy) = await GetCurrentUserContextAsync();
        if (nip == null)
            return Unauthorized(ApiResponse<object?>.Fail("Brak profilu firmy"));

        var draft = await _draftService.ApproveAsync(id, processedBy, nip);

        if (draft == null)
            return BadRequest(ApiResponse<object?>.Fail("Szkic nie znaleziony lub nie ma statusu PENDING"));

        return Ok(ApiResponse<object>.Ok(draft, "Szkic zatwierdzony"));
    }

    [HttpPost("drafts/{id}/reject")]
    [Authorize]
    public async Task<IActionResult> RejectDraft(string id, [FromBody] RejectDraftRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
            return BadRequest(ApiResponse<object?>.Fail("Powód odrzucenia jest wymagany"));

        var (nip, processedBy) = await GetCurrentUserContextAsync();
        if (nip == null)
            return Unauthorized(ApiResponse<object?>.Fail("Brak profilu firmy"));

        var draft = await _draftService.RejectAsync(id, processedBy, request.Reason, nip);

        if (draft == null)
            return BadRequest(ApiResponse<object?>.Fail("Szkic nie znaleziony lub nie ma statusu PENDING"));

        return Ok(ApiResponse<object>.Ok(draft, "Szkic odrzucony"));
    }

    private async Task<string?> GetCurrentUserNipAsync()
    {
        var userId = GetUserId();
        if (userId == null) return null;

        return await _db.CompanyProfiles
            .Where(c => c.UserId == userId.Value && c.IsActive)
            .Select(c => c.Nip)
            .FirstOrDefaultAsync();
    }

    private async Task<(string? Nip, string ProcessedBy)> GetCurrentUserContextAsync()
    {
        var userId = GetUserId();
        if (userId == null) return (null, "unknown");

        var profile = await _db.Users
            .Where(u => u.Id == userId.Value)
            .Select(u => new { u.Email, Nip = u.CompanyProfile != null ? u.CompanyProfile.Nip : null, Active = u.CompanyProfile != null && u.CompanyProfile.IsActive })
            .FirstOrDefaultAsync();

        if (profile == null || !profile.Active)
            return (null, profile?.Email ?? "unknown");

        return (profile.Nip, profile.Email);
    }
}
