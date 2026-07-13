using System.Net.Http.Headers;
using System.Text.Json;
using KSeF.Backend.Infrastructure.KSeF;
using KSeF.Backend.Models.Responses.Auth;
using KSeF.Backend.Services.Interfaces.KSeF;
using KSeF.Backend.Services.KSeF.Session;

namespace KSeF.Backend.Services.KSeF.Auth;

public class KSeFTokenRefreshService : IKSeFTokenRefreshService
{
    private static readonly JsonSerializerOptions JsonOptions =
        new() { PropertyNameCaseInsensitive = true };

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IKSeFEnvironmentService _environmentService;
    private readonly KSeFSessionManager _sessionManager;
    private readonly ILogger<KSeFTokenRefreshService> _logger;

    public KSeFTokenRefreshService(
        IHttpClientFactory httpClientFactory,
        IKSeFEnvironmentService environmentService,
        KSeFSessionManager sessionManager,
        ILogger<KSeFTokenRefreshService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _environmentService = environmentService;
        _sessionManager = sessionManager;
        _logger = logger;
    }

    public async Task<bool> RefreshTokenIfNeededAsync(CancellationToken ct = default)
    {
        if (!_sessionManager.NeedsTokenRefresh)
            return false;

        var refreshToken = _sessionManager.RefreshToken;
        if (string.IsNullOrEmpty(refreshToken))
        {
            _logger.LogWarning("Cannot refresh token - no refresh token available");
            return false;
        }

        try
        {
            var client = _httpClientFactory.CreateClient("KSeF");
            var environment = _sessionManager.Environment
                ?? throw new InvalidOperationException("Brak środowiska dla aktywnej sesji KSeF");
            client.BaseAddress = new Uri(_environmentService.GetApiBaseUrl(environment));

            using var request = new HttpRequestMessage(HttpMethod.Post, "auth/token/refresh");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", refreshToken);
            using var response = await client.SendAsync(request, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError(
                    "Token refresh failed with status {Status}: {Error}",
                    response.StatusCode,
                    KSeFErrorParser.Parse(responseBody));
                return false;
            }

            var result = JsonSerializer.Deserialize<TokenRefreshResponse>(responseBody, JsonOptions);
            if (result?.AccessToken == null)
            {
                _logger.LogError("Token refresh response missing accessToken");
                return false;
            }

            _sessionManager.UpdateAccessToken(result);
            _logger.LogInformation("Access token refreshed successfully");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception during token refresh");
            return false;
        }
    }
}
