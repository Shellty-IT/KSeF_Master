// Services/KSeFAuthService.cs
using System.Text;
using System.Text.Json;
using KSeF.Backend.Infrastructure.KSeF;
using KSeF.Backend.Models.Responses.Auth;
using KSeF.Backend.Models.Responses.Certificate;
using KSeF.Backend.Models.Responses.Common;
using KSeF.Backend.Services.Interfaces.KSeF;
using KSeF.Backend.Services.KSeF.Session;

namespace KSeF.Backend.Services.KSeF.Common;

public class KSeFAuthService : IKSeFAuthService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IKSeFEnvironmentService _environmentService;
    private readonly IKSeFCryptoService _cryptoService;
    private readonly IKSeFChallengeService _challengeService;
    private readonly IKSeFAuthPollingService _pollingService;
    private readonly IKSeFAuthRedeemService _redeemService;
    private readonly IKSeFTokenRefreshService _refreshService;
    private readonly KSeFSessionManager _session;
    private readonly ILogger<KSeFAuthService> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    public KSeFAuthService(
        IHttpClientFactory httpClientFactory,
        IKSeFEnvironmentService environmentService,
        IKSeFCryptoService cryptoService,
        IKSeFChallengeService challengeService,
        IKSeFAuthPollingService pollingService,
        IKSeFAuthRedeemService redeemService,
        IKSeFTokenRefreshService refreshService,
        KSeFSessionManager session,
        ILogger<KSeFAuthService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _environmentService = environmentService;
        _cryptoService = cryptoService;
        _challengeService = challengeService;
        _pollingService = pollingService;
        _redeemService = redeemService;
        _refreshService = refreshService;
        _session = session;
        _logger = logger;
        _jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
    }

    public async Task<AuthResult> LoginAsync(
        string nip,
        string ksefToken,
        string environment = "Test",
        CancellationToken ct = default)
    {
        try
        {
            _logger.LogInformation("═══════════════════════════════════════════════════════════════");
            _logger.LogInformation("  LOGOWANIE DO KSeF API v2 — NIP: {Nip}, ENV: {Env}", nip, environment);
            _logger.LogInformation("═══════════════════════════════════════════════════════════════");

            var apiBaseUrl = _environmentService.GetApiBaseUrl(environment);
            var client = CreateClient(apiBaseUrl);

            _logger.LogInformation("--- Krok 1: Pobieranie listy certyfikatów publicznych ---");
            var certificates = await FetchPublicCertificatesAsync(client, environment, ct);
            _logger.LogInformation("  ✓ Pobrano {Count} certyfikatów", certificates.Count);

            _session.SetCertificates(environment, certificates);

            var now = DateTime.UtcNow;
            var tokenEncryptionCert = certificates.FirstOrDefault(c =>
                c.ValidFrom <= now && c.ValidTo > now &&
                c.Usage?.Any(u =>
                    u.Equals("KsefTokenEncryption", StringComparison.OrdinalIgnoreCase)) == true);

            if (tokenEncryptionCert == null)
                return Fail("Brak ważnego certyfikatu do szyfrowania tokenu KSeF");

            if (string.IsNullOrWhiteSpace(tokenEncryptionCert.PublicKeyId))
                return Fail("Certyfikat KSeF nie zawiera identyfikatora klucza publicznego");

            _logger.LogInformation("--- Krok 2: POST auth/challenge ---");
            var (challenge, timestampMs) = await _challengeService.GetChallengeAsync(client, ct);
            _logger.LogInformation("  ✓ Pobrano challenge uwierzytelniający");

            _logger.LogInformation("--- Krok 3: Szyfrowanie tokenu certyfikatem ---");
            var encryptedToken = _cryptoService.EncryptToken(ksefToken, timestampMs, tokenEncryptionCert.Certificate);
            _logger.LogInformation("  ✓ Token zaszyfrowany");

            _logger.LogInformation("--- Krok 4: POST auth/ksef-token ---");
            var (authenticationToken, referenceNumber) = await SendAuthTokenRequestAsync(
                client, nip, challenge, encryptedToken, tokenEncryptionCert.PublicKeyId, ct);
            _logger.LogInformation("  ✓ ReferenceNumber: {Ref}", referenceNumber);

            _logger.LogInformation("--- Krok 5: Polling GET auth/{Ref} ---", referenceNumber);
            var finalToken = await _pollingService.PollAuthStatusAsync(
                client, referenceNumber, authenticationToken, ct);

            if (finalToken == null)
                return Fail("Timeout autoryzacji — brak odpowiedzi z KSeF");

            _logger.LogInformation("--- Krok 6: POST auth/token/redeem ---");
            var tokens = await _redeemService.RedeemTokenAsync(client, finalToken, ct);

            if (tokens?.AccessToken == null)
                return Fail("Brak accessToken w odpowiedzi KSeF");

            _session.SetAuthSession(nip, tokens, environment);

            _logger.LogInformation("═══════════════════════════════════════════════════════════════");
            _logger.LogInformation("  ✅ ZALOGOWANO POMYŚLNIE DO KSeF!");
            _logger.LogInformation("  AccessToken ważny do: {Until}", tokens.AccessToken.ValidUntil);
            if (tokens.RefreshToken != null)
                _logger.LogInformation("  RefreshToken ważny do: {Until}", tokens.RefreshToken.ValidUntil);
            _logger.LogInformation("═══════════════════════════════════════════════════════════════");

            return new AuthResult
            {
                Success = true,
                ReferenceNumber = referenceNumber,
                AccessTokenValidUntil = tokens.AccessToken.ValidUntil,
                RefreshTokenValidUntil = tokens.RefreshToken?.ValidUntil
            };
        }
        catch (KSeFApiException ex)
        {
            _logger.LogWarning("KSeF rejected login for NIP {Nip}: {Error}", nip, ex.Message);
            return Fail(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Login failed for NIP: {Nip}", nip);
            return Fail("Nie udało się zalogować do KSeF");
        }
    }

    public Task<bool> RefreshTokenIfNeededAsync(CancellationToken ct = default)
        => _refreshService.RefreshTokenIfNeededAsync(ct);

    public void Logout()
    {
        _session.ClearAuthSession();
        _logger.LogInformation("Logged out from KSeF");
    }

    private HttpClient CreateClient(string baseUrl)
    {
        var client = _httpClientFactory.CreateClient("KSeF");
        client.BaseAddress = new Uri(baseUrl);
        return client;
    }

    private async Task<List<CertificateInfo>> FetchPublicCertificatesAsync(
        HttpClient client,
        string environment,
        CancellationToken ct)
    {
        var cached = _session.GetCachedCertificates(environment);
        if (cached != null)
        {
            _logger.LogDebug("Certyfikaty z cache ({Count} szt.)", cached.Count);
            return cached;
        }

        using var response = await client.GetAsync("security/public-key-certificates", ct);
        var responseBody = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
            throw new KSeFApiException(
                $"Failed to fetch certificates: {KSeFErrorParser.Parse(responseBody)}",
                response.StatusCode);

        try
        {
            var certificates = JsonSerializer.Deserialize<List<CertificateInfo>>(responseBody, _jsonOptions)
                ?? new List<CertificateInfo>();
            _session.SetCertificates(environment, certificates);
            return certificates;
        }
        catch
        {
            var wrapper = JsonSerializer.Deserialize<CertificatesWrapper>(responseBody, _jsonOptions);
            var certificates = wrapper?.Certificates ?? new List<CertificateInfo>();
            _session.SetCertificates(environment, certificates);
            return certificates;
        }
    }

    private async Task<(string authenticationToken, string referenceNumber)> SendAuthTokenRequestAsync(
        HttpClient client,
        string nip,
        string challenge,
        string encryptedToken,
        string publicKeyId,
        CancellationToken ct)
    {
        var requestBody = new
        {
            challenge,
            contextIdentifier = new { type = "Nip", value = nip },
            encryptedToken,
            publicKeyId
        };

        var content = new StringContent(
            JsonSerializer.Serialize(requestBody),
            Encoding.UTF8,
            "application/json");

        using var response = await client.PostAsync("auth/ksef-token", content, ct);
        var responseBody = await response.Content.ReadAsStringAsync(ct);

        _logger.LogInformation("  Response: {Status}", response.StatusCode);

        if (!response.IsSuccessStatusCode)
        {
            var error = KSeFErrorParser.Parse(responseBody);
            _logger.LogError("KSeF token authentication failed: {Error}", error);
            throw new KSeFApiException($"auth/ksef-token failed: {error}", response.StatusCode);
        }

        var parsed = JsonSerializer.Deserialize<AuthTokenResponse>(responseBody, _jsonOptions);
        var authToken = parsed?.AuthenticationToken?.Token;
        var refNumber = parsed?.ReferenceNumber;

        if (string.IsNullOrEmpty(authToken) || string.IsNullOrEmpty(refNumber))
            throw new InvalidOperationException("Missing authenticationToken or referenceNumber in response");

        return (authToken, refNumber);
    }

    private static AuthResult Fail(string error) =>
        new() { Success = false, Error = error };

    private class CertificatesWrapper
    {
        public List<CertificateInfo> Certificates { get; set; } = new();
    }
}
