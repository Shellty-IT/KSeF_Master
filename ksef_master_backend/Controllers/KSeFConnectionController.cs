using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KSeF.Backend.Models.Common;
using KSeF.Backend.Services.Interfaces.Auth;
using KSeF.Backend.Services.Interfaces.KSeF;
using KSeF.Backend.Services.KSeF.Session;

namespace KSeF.Backend.Controllers;

[Route("api/auth/ksef")]
[Authorize]
public class KSeFConnectionController : BaseApiController
{
    private readonly IUserAuthService _userAuthService;
    private readonly ICompanyService _companyService;
    private readonly ICertificateService _certificateService;
    private readonly IKSeFAuthService _ksefAuthService;
    private readonly IKSeFCertAuthService _ksefCertAuthService;
    private readonly KSeFSessionManager _sessionManager;
    private readonly ILogger<KSeFConnectionController> _logger;

    public KSeFConnectionController(
        IUserAuthService userAuthService,
        ICompanyService companyService,
        ICertificateService certificateService,
        IKSeFAuthService ksefAuthService,
        IKSeFCertAuthService ksefCertAuthService,
        KSeFSessionManager sessionManager,
        ILogger<KSeFConnectionController> logger)
    {
        _userAuthService = userAuthService;
        _companyService = companyService;
        _certificateService = certificateService;
        _ksefAuthService = ksefAuthService;
        _ksefCertAuthService = ksefCertAuthService;
        _sessionManager = sessionManager;
        _logger = logger;
    }

    [HttpPost("connect")]
    public async Task<IActionResult> ConnectToKsef()
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(ApiResponse<object?>.Fail("Nieprawidłowy token"));

        var user = await _userAuthService.GetUserByIdAsync(userId.Value);
        if (user?.Company == null)
            return BadRequest(ApiResponse<object?>.Fail("Najpierw skonfiguruj firmę"));

        var authMethod = user.Company.AuthMethod;
        var environment = user.Company.KsefEnvironment;

        _logger.LogInformation(
            "Connecting to KSeF for user {UserId}, method: {Method}, environment: {Env}",
            userId, authMethod, environment);

        if (authMethod == "certificate")
        {
            var certData = await _certificateService.GetDecryptedCertificateAsync(userId.Value);
            if (certData == null)
                return BadRequest(ApiResponse<object?>.Fail("Certyfikat nie jest skonfigurowany lub jest nieprawidłowy"));

            var authResult = await _ksefCertAuthService.AuthenticateWithCertificateAsync(
                user.Company.Nip,
                certData.Value.cert!,
                certData.Value.key!,
                certData.Value.password,
                environment);

            if (!authResult.Success)
            {
                _logger.LogError("KSeF cert auth failed for user {UserId}: {Error}", userId, authResult.Error);
                return BadRequest(ApiResponse<object?>.Fail(authResult.Error ?? "Nie udało się połączyć z KSeF"));
            }

            return Ok(ApiResponse<object>.Ok(
                new { referenceNumber = authResult.ReferenceNumber, environment },
                $"Połączono z KSeF (certyfikat, środowisko: {environment})"));
        }
        else
        {
            var ksefToken = await _companyService.GetDecryptedKsefTokenAsync(userId.Value);
            if (string.IsNullOrEmpty(ksefToken))
                return BadRequest(ApiResponse<object?>.Fail("Token KSeF nie jest skonfigurowany"));

            var authResult = await _ksefAuthService.LoginAsync(user.Company.Nip, ksefToken, environment);

            if (!authResult.Success)
            {
                _logger.LogError("KSeF token auth failed for user {UserId}: {Error}", userId, authResult.Error);
                return BadRequest(ApiResponse<object?>.Fail(authResult.Error ?? "Nie udało się połączyć z KSeF"));
            }

            return Ok(ApiResponse<object>.Ok(
                new { referenceNumber = authResult.ReferenceNumber, environment },
                $"Połączono z KSeF (token, środowisko: {environment})"));
        }
    }

    [HttpPost("disconnect")]
    public IActionResult DisconnectFromKsef()
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(ApiResponse<object?>.Fail("Nieprawidłowy token"));

        _sessionManager.ClearAuthSession();

        _logger.LogInformation("User {UserId} disconnected from KSeF", userId);

        return Ok(ApiResponse.Ok("Odłączono od KSeF"));
    }
}
