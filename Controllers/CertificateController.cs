using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KSeF.Backend.Models.Common;
using KSeF.Backend.Models.Requests;
using KSeF.Backend.Services.Interfaces.Auth;

namespace KSeF.Backend.Controllers;

[Route("api/auth/company")]
[Authorize]
public class CertificateController : BaseApiController
{
    private readonly ICertificateService _certificateService;

    public CertificateController(ICertificateService certificateService)
    {
        _certificateService = certificateService;
    }

    [HttpPost("certificate")]
    public async Task<IActionResult> UploadCertificate([FromBody] UploadCertificateRequest request)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(ApiResponse<object?>.Fail("Nieprawidłowy token"));

        var result = await _certificateService.UploadCertificateAsync(userId.Value, request);

        if (!result.Success)
            return BadRequest(ApiResponse<object?>.Fail(result.Error ?? "Nieznany błąd"));

        return Ok(ApiResponse<object>.Ok(
            new { user = result.User },
            "Certyfikat został przesłany"));
    }

    [HttpPut("auth-method")]
    public async Task<IActionResult> SwitchAuthMethod([FromBody] SwitchAuthMethodRequest request)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(ApiResponse<object?>.Fail("Nieprawidłowy token"));

        var result = await _certificateService.SwitchAuthMethodAsync(userId.Value, request);

        if (!result.Success)
            return BadRequest(ApiResponse<object?>.Fail(result.Error ?? "Nieznany błąd"));

        return Ok(ApiResponse<object>.Ok(
            new { user = result.User },
            $"Metoda uwierzytelniania zmieniona na: {request.AuthMethod}"));
    }

    [HttpDelete("certificate")]
    public async Task<IActionResult> DeleteCertificate()
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(ApiResponse<object?>.Fail("Nieprawidłowy token"));

        var result = await _certificateService.DeleteCertificateAsync(userId.Value);

        if (!result.Success)
            return BadRequest(ApiResponse<object?>.Fail(result.Error ?? "Nieznany błąd"));

        return Ok(ApiResponse<object>.Ok(
            new { user = result.User },
            "Certyfikat został usunięty"));
    }

    [HttpGet("certificate/info")]
    public async Task<IActionResult> GetCertificateInfo()
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(ApiResponse<object?>.Fail("Nieprawidłowy token"));

        var info = await _certificateService.GetCertificateInfoAsync(userId.Value);

        if (info == null)
            return NotFound(ApiResponse<object?>.Fail("Brak informacji o certyfikacie"));

        return Ok(ApiResponse<object>.Ok(info));
    }
}
