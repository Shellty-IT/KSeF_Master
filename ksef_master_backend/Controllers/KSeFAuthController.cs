using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using KSeF.Backend.Models.Common;
using KSeF.Backend.Models.Requests;
using KSeF.Backend.Services.Interfaces.KSeF;
using KSeF.Backend.Services.KSeF.Session;

namespace KSeF.Backend.Controllers;

[Route("api/ksef")]
[Produces("application/json")]
public class KSeFAuthController : BaseApiController
{
    private readonly IKSeFAuthService _authService;
    private readonly KSeFSessionManager _session;
    private readonly ILogger<KSeFAuthController> _logger;

    public KSeFAuthController(
        IKSeFAuthService authService,
        KSeFSessionManager session,
        ILogger<KSeFAuthController> logger)
    {
        _authService = authService;
        _session = session;
        _logger = logger;
    }

    [HttpGet("status")]
    [Authorize]
    public IActionResult GetStatus()
    {
        return Ok(new
        {
            server = "OK",
            timestamp = DateTime.UtcNow,
            version = "2.0.0",
            session = _session.GetSessionInfo()
        });
    }

    [HttpPost("login")]
    [Authorize]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request,
        [FromServices] IValidator<LoginRequest> validator,
        CancellationToken ct)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            return BadRequest(new
            {
                success = false,
                error = "Błędy walidacji",
                details = validationResult.Errors.Select(e => e.ErrorMessage)
            });

        _logger.LogInformation("KSeF login request for NIP: {Nip}", request.Nip);

        var result = await _authService.LoginAsync(
            request.Nip, request.KsefToken, request.KsefEnvironment, ct);

        if (!result.Success)
        {
            _logger.LogWarning("KSeF login failed: {Error}", result.Error);
            return BadRequest(ApiResponse<object?>.Fail(result.Error ?? "Logowanie do KSeF nie powiodło się"));
        }

        return Ok(ApiResponse<object>.Ok(new
        {
            nip = request.Nip,
            referenceNumber = result.ReferenceNumber,
            accessTokenValidUntil = result.AccessTokenValidUntil,
            refreshTokenValidUntil = result.RefreshTokenValidUntil
        }, "Zalogowano pomyślnie do KSeF"));
    }

    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        var nip = _session.Nip;
        _authService.Logout();
        _logger.LogInformation("KSeF logout for NIP: {Nip}", nip ?? "none");
        return Ok(ApiResponse.Ok("Wylogowano pomyślnie"));
    }
}
