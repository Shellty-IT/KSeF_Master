using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KSeF.Backend.Models.Common;
using KSeF.Backend.Models.Requests;
using KSeF.Backend.Services.Interfaces.Auth;

namespace KSeF.Backend.Controllers;

[Route("api/auth/company")]
[Authorize]
public class CompanyController : BaseApiController
{
    private readonly ICompanyService _companyService;

    public CompanyController(ICompanyService companyService)
    {
        _companyService = companyService;
    }

    [HttpPost]
    public async Task<IActionResult> SetupCompany([FromBody] CompanySetupRequest request)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(ApiResponse<object?>.Fail("Nieprawidłowy token"));

        var result = await _companyService.SetupCompanyAsync(userId.Value, request);

        if (!result.Success)
            return BadRequest(ApiResponse<object?>.Fail(result.Error ?? "Nieznany błąd"));

        return Ok(ApiResponse<object>.Ok(
            new { token = result.Token, user = result.User },
            "Firma została skonfigurowana"));
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateCompanyProfile([FromBody] UpdateCompanyProfileRequest request)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(ApiResponse<object?>.Fail("Nieprawidłowy token"));

        var result = await _companyService.UpdateCompanyProfileAsync(userId.Value, request);

        if (!result.Success)
            return BadRequest(ApiResponse<object?>.Fail(result.Error ?? "Nieznany błąd"));

        return Ok(ApiResponse<object>.Ok(
            new { user = result.User },
            "Profil firmy zaktualizowany"));
    }

    [HttpPut("token")]
    public async Task<IActionResult> UpdateKsefToken([FromBody] UpdateKsefTokenRequest request)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(ApiResponse<object?>.Fail("Nieprawidłowy token"));

        var result = await _companyService.UpdateKsefTokenAsync(userId.Value, request);

        if (!result.Success)
            return BadRequest(ApiResponse<object?>.Fail(result.Error ?? "Nieznany błąd"));

        return Ok(ApiResponse<object>.Ok(
            new { user = result.User },
            "Token KSeF zaktualizowany"));
    }

    [HttpPut("environment")]
    public async Task<IActionResult> UpdateKsefEnvironment([FromBody] UpdateKsefEnvironmentRequest request)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(ApiResponse<object?>.Fail("Nieprawidłowy token"));

        var result = await _companyService.UpdateKsefEnvironmentAsync(userId.Value, request);

        if (!result.Success)
            return BadRequest(ApiResponse<object?>.Fail(result.Error ?? "Nieznany błąd"));

        return Ok(ApiResponse<object>.Ok(
            new { user = result.User },
            $"Środowisko KSeF zmienione na: {request.KsefEnvironment}"));
    }
}
