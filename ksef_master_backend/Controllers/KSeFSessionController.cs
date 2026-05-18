using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KSeF.Backend.Models.Common;
using KSeF.Backend.Services.Interfaces.KSeF;
using KSeF.Backend.Services.KSeF.Session;

namespace KSeF.Backend.Controllers;

[Route("api/ksef")]
[Produces("application/json")]
[Authorize]
public class KSeFSessionController : BaseApiController
{
    private readonly IKSeFInvoiceService _invoiceService;
    private readonly KSeFSessionManager _session;
    private readonly ILogger<KSeFSessionController> _logger;

    public KSeFSessionController(
        IKSeFInvoiceService invoiceService,
        KSeFSessionManager session,
        ILogger<KSeFSessionController> logger)
    {
        _invoiceService = invoiceService;
        _session = session;
        _logger = logger;
    }

    [HttpPost("session/open")]
    public async Task<IActionResult> OpenSession(CancellationToken ct)
    {
        var result = await _invoiceService.OpenOnlineSessionAsync(ct);

        if (!result.Success)
            return BadRequest(ApiResponse<object?>.Fail(result.Error ?? "Otwarcie sesji nie powiodło się"));

        return Ok(ApiResponse<object>.Ok(new
        {
            sessionReferenceNumber = result.SessionReferenceNumber,
            validUntil = result.ValidUntil
        }, "Sesja otwarta"));
    }

    [HttpPost("session/close")]
    public IActionResult CloseSession()
    {
        _session.ClearOnlineSession();
        _logger.LogInformation("Online session closed");
        return Ok(ApiResponse.Ok("Sesja wysyłkowa zamknięta"));
    }
}
