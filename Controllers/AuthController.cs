using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using KSeF.Backend.Models.Common;
using KSeF.Backend.Models.Requests;
using KSeF.Backend.Services.Interfaces.Auth;
using KSeF.Backend.Services.KSeF.Session;

namespace KSeF.Backend.Controllers;

[Route("api/auth")]
public class AuthController : BaseApiController
{
    private readonly IUserAuthService _userAuthService;
    private readonly KSeFSessionManager _sessionManager;

    public AuthController(
        IUserAuthService userAuthService,
        KSeFSessionManager sessionManager)
    {
        _userAuthService = userAuthService;
        _sessionManager = sessionManager;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await _userAuthService.RegisterAsync(request);

        if (!result.Success)
            return BadRequest(ApiResponse<object?>.Fail(result.Error ?? "Nieznany błąd"));

        return Ok(ApiResponse<object>.Ok(new { token = result.Token, user = result.User }));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginAppRequest request)
    {
        var result = await _userAuthService.LoginAsync(request);

        if (!result.Success)
            return BadRequest(ApiResponse<object?>.Fail(result.Error ?? "Nieznany błąd"));

        return Ok(ApiResponse<object>.Ok(new { token = result.Token, user = result.User }));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(ApiResponse<object?>.Fail("Nieprawidłowy token"));

        var user = await _userAuthService.GetUserByIdAsync(userId.Value);
        if (user == null)
            return NotFound(ApiResponse<object?>.Fail("Użytkownik nie istnieje"));

        return Ok(ApiResponse<object>.Ok(new
        {
            user,
            isKsefConnected = _sessionManager.IsAuthenticated,
            needsCompanySetup = user.Company == null
        }));
    }
}
