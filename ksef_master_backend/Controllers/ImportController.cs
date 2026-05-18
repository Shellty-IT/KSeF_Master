// Controllers/ImportController.cs
using Microsoft.AspNetCore.Mvc;
using KSeF.Backend.Middleware;
using KSeF.Backend.Models.Common;
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
    private readonly ILogger<ImportController> _logger;

    public ImportController(
        IExternalDraftService draftService,
        ExternalDraftValidator validator,
        ILogger<ImportController> logger)
    {
        _draftService = draftService;
        _validator = validator;
        _logger = logger;
    }

    [HttpPost("smartquote")]
    [ApiKeyAuth]
    public IActionResult ImportFromSmartQuote([FromBody] SmartQuoteImportRequest request)
    {
        _logger.LogInformation(
            "SmartQuote import: SmartQuoteId={Id}, OfferNumber={Number}",
            request.SmartQuoteId, request.OfferNumber);

        var validationErrors = _validator.Validate(request);
        if (validationErrors.Count > 0)
            return BadRequest(new { success = false, message = string.Join("; ", validationErrors) });

        if (_draftService.ExistsBySmartQuoteId(request.SmartQuoteId))
            return Conflict(new { success = false, message = "Szkic z tym smartQuoteId już istnieje" });

        var draft = _draftService.Import(request);

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

    [HttpGet("drafts")]
    public IActionResult GetDrafts([FromQuery] string? status = null)
    {
        var drafts = _draftService.GetAll(status);
        return Ok(ApiResponse<object>.Ok(new { drafts, total = drafts.Count }));
    }

    [HttpGet("drafts/{id}")]
    public IActionResult GetDraft(string id)
    {
        var draft = _draftService.GetById(id);

        if (draft == null)
            return NotFound(ApiResponse<object?>.Fail("Szkic nie znaleziony"));

        return Ok(ApiResponse<object>.Ok(draft));
    }

    [HttpPost("drafts/{id}/approve")]
    public IActionResult ApproveDraft(string id)
    {
        var draft = _draftService.Approve(id, processedBy: "operator");

        if (draft == null)
            return BadRequest(ApiResponse<object?>.Fail("Szkic nie znaleziony lub nie ma statusu PENDING"));

        return Ok(ApiResponse<object>.Ok(draft, "Szkic zatwierdzony"));
    }

    [HttpPost("drafts/{id}/reject")]
    public IActionResult RejectDraft(string id, [FromBody] RejectDraftRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
            return BadRequest(ApiResponse<object?>.Fail("Powód odrzucenia jest wymagany"));

        var draft = _draftService.Reject(id, processedBy: "operator", request.Reason);

        if (draft == null)
            return BadRequest(ApiResponse<object?>.Fail("Szkic nie znaleziony lub nie ma statusu PENDING"));

        return Ok(ApiResponse<object>.Ok(draft, "Szkic odrzucony"));
    }
}
