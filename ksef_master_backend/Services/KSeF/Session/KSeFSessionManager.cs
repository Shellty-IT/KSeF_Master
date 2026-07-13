using System.Collections.Concurrent;
using System.Security.Claims;
using System.Security.Cryptography;
using KSeF.Backend.Models.Responses.Auth;
using KSeF.Backend.Models.Responses.Certificate;

namespace KSeF.Backend.Services.KSeF.Session;

/// <summary>
/// Stores the short-lived KSeF state in memory and isolates it by application user.
/// The service is a singleton because a KSeF session spans multiple HTTP requests.
/// </summary>
public class KSeFSessionManager
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<KSeFSessionManager> _logger;
    private readonly ConcurrentDictionary<int, SessionState> _sessions = new();

    public KSeFSessionManager(
        IHttpContextAccessor httpContextAccessor,
        ILogger<KSeFSessionManager> logger)
    {
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public bool IsAuthenticated
    {
        get
        {
            var state = GetCurrentState();
            lock (state.SyncRoot)
            {
                return IsAuthenticatedCore(state);
            }
        }
    }

    public string? Nip
    {
        get
        {
            var state = GetCurrentState();
            lock (state.SyncRoot) { return state.Nip; }
        }
    }

    public string? Environment
    {
        get
        {
            var state = GetCurrentState();
            lock (state.SyncRoot) { return state.Environment; }
        }
    }

    public string? AccessToken
    {
        get
        {
            var state = GetCurrentState();
            lock (state.SyncRoot)
            {
                return IsAuthenticatedCore(state) ? state.AccessToken : null;
            }
        }
    }

    public DateTime? AccessTokenExpiry
    {
        get
        {
            var state = GetCurrentState();
            lock (state.SyncRoot) { return state.AccessTokenExpiry; }
        }
    }

    public string? RefreshToken
    {
        get
        {
            var state = GetCurrentState();
            lock (state.SyncRoot) { return state.RefreshToken; }
        }
    }

    public byte[]? AesKey
    {
        get
        {
            var state = GetCurrentState();
            lock (state.SyncRoot) { return state.AesKey?.ToArray(); }
        }
    }

    public byte[]? Iv
    {
        get
        {
            var state = GetCurrentState();
            lock (state.SyncRoot) { return state.Iv?.ToArray(); }
        }
    }

    public string? SessionReferenceNumber
    {
        get
        {
            var state = GetCurrentState();
            lock (state.SyncRoot)
            {
                return HasActiveOnlineSessionCore(state) ? state.OnlineSessionReference : null;
            }
        }
    }

    public DateTime? SessionValidUntil
    {
        get
        {
            var state = GetCurrentState();
            lock (state.SyncRoot) { return state.OnlineSessionExpiry; }
        }
    }

    public void SetAuthSession(string nip, TokenRedeemResponse tokens, string environment)
    {
        var state = GetCurrentState();
        lock (state.SyncRoot)
        {
            state.Nip = nip;
            state.Environment = environment;
            state.AccessToken = tokens.AccessToken?.Token;
            state.AccessTokenExpiry = tokens.AccessToken?.ValidUntil;
            state.RefreshToken = tokens.RefreshToken?.Token;
            state.RefreshTokenExpiry = tokens.RefreshToken?.ValidUntil;

            // An online session belongs to the access token and environment that created it.
            ClearOnlineSessionCore(state);

            _logger.LogInformation(
                "Auth session set for user {UserId}, NIP {Nip}, environment {Environment}, valid until {Expiry}",
                GetCurrentUserId(), nip, environment, state.AccessTokenExpiry);
        }
    }

    public void SetAuthSessionFromStatus(string nip, AuthStatusResponse status, string environment)
    {
        var state = GetCurrentState();
        lock (state.SyncRoot)
        {
            state.Nip = nip;
            state.Environment = environment;
            state.AccessToken = status.AccessToken?.Token;
            state.AccessTokenExpiry = status.AccessToken?.ValidUntil;
            state.RefreshToken = status.RefreshToken?.Token;
            state.RefreshTokenExpiry = status.RefreshToken?.ValidUntil;
            ClearOnlineSessionCore(state);

            _logger.LogInformation(
                "Auth session restored for user {UserId}, NIP {Nip}, environment {Environment}",
                GetCurrentUserId(), nip, environment);
        }
    }

    public void ClearAuthSession()
    {
        var userId = GetCurrentUserId();
        if (_sessions.TryRemove(userId, out var state))
        {
            lock (state.SyncRoot)
            {
                if (IsAuthenticatedCore(state))
                    _logger.LogInformation("Auth session cleared for user {UserId}", userId);

                ClearSensitiveState(state);
            }
        }
    }

    public bool NeedsTokenRefresh
    {
        get
        {
            var state = GetCurrentState();
            lock (state.SyncRoot)
            {
                if (!state.AccessTokenExpiry.HasValue) return false;
                return state.AccessTokenExpiry.Value - DateTime.UtcNow < TimeSpan.FromMinutes(10);
            }
        }
    }

    public void UpdateAccessToken(TokenRefreshResponse refreshResponse)
    {
        var state = GetCurrentState();
        lock (state.SyncRoot)
        {
            state.AccessToken = refreshResponse.AccessToken?.Token;
            state.AccessTokenExpiry = refreshResponse.AccessToken?.ValidUntil;
            _logger.LogInformation(
                "Access token refreshed for user {UserId}, valid until {Expiry}",
                GetCurrentUserId(), state.AccessTokenExpiry);
        }
    }

    public bool HasActiveOnlineSession
    {
        get
        {
            var state = GetCurrentState();
            lock (state.SyncRoot) { return HasActiveOnlineSessionCore(state); }
        }
    }

    public string? OnlineSessionReference => SessionReferenceNumber;

    public void SetOnlineSession(string referenceNumber, DateTime validUntil, byte[] aesKey, byte[] iv)
    {
        var state = GetCurrentState();
        lock (state.SyncRoot)
        {
            state.OnlineSessionReference = referenceNumber;
            state.OnlineSessionExpiry = validUntil;
            state.AesKey = aesKey.ToArray();
            state.Iv = iv.ToArray();

            _logger.LogInformation(
                "Online session set for user {UserId}: {ReferenceNumber}, valid until {Expiry}",
                GetCurrentUserId(), referenceNumber, validUntil);
        }
    }

    public void ClearOnlineSession()
    {
        var state = GetCurrentState();
        lock (state.SyncRoot)
        {
            var hadSession = HasActiveOnlineSessionCore(state);
            ClearOnlineSessionCore(state);
            if (hadSession)
                _logger.LogInformation("Online session cleared for user {UserId}", GetCurrentUserId());
        }
    }

    public object GetSessionInfo()
    {
        var state = GetCurrentState();
        lock (state.SyncRoot)
        {
            return new
            {
                isAuthenticated = IsAuthenticatedCore(state),
                nip = state.Nip,
                environment = state.Environment,
                accessTokenExpiry = state.AccessTokenExpiry,
                hasRefreshToken = !string.IsNullOrEmpty(state.RefreshToken),
                hasOnlineSession = HasActiveOnlineSessionCore(state),
                onlineSessionExpiry = state.OnlineSessionExpiry
            };
        }
    }

    public List<CertificateInfo>? GetCachedCertificates(string environment)
    {
        var state = GetCurrentState();
        lock (state.SyncRoot)
        {
            return state.CachedCertificates.TryGetValue(environment, out var certificates)
                ? certificates.ToList()
                : null;
        }
    }

    public void SetCertificates(string environment, List<CertificateInfo> certificates)
    {
        var state = GetCurrentState();
        lock (state.SyncRoot)
        {
            state.CachedCertificates[environment] = certificates.ToList();
            _logger.LogInformation(
                "Cached {Count} public certificates for user {UserId}, environment {Environment}",
                certificates.Count, GetCurrentUserId(), environment);
        }
    }

    private SessionState GetCurrentState()
    {
        var userId = GetCurrentUserId();
        return _sessions.GetOrAdd(userId, static _ => new SessionState());
    }

    private int GetCurrentUserId()
    {
        var claim = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(claim, out var userId))
            throw new UnauthorizedAccessException("Brak kontekstu uwierzytelnionego użytkownika");

        return userId;
    }

    private static bool IsAuthenticatedCore(SessionState state) =>
        !string.IsNullOrEmpty(state.AccessToken) &&
        state.AccessTokenExpiry.HasValue &&
        state.AccessTokenExpiry.Value > DateTime.UtcNow;

    private static bool HasActiveOnlineSessionCore(SessionState state) =>
        !string.IsNullOrEmpty(state.OnlineSessionReference) &&
        state.OnlineSessionExpiry.HasValue &&
        state.OnlineSessionExpiry.Value > DateTime.UtcNow;

    private static void ClearOnlineSessionCore(SessionState state)
    {
        state.OnlineSessionReference = null;
        state.OnlineSessionExpiry = null;
        if (state.AesKey is not null) CryptographicOperations.ZeroMemory(state.AesKey);
        if (state.Iv is not null) CryptographicOperations.ZeroMemory(state.Iv);
        state.AesKey = null;
        state.Iv = null;
    }

    private static void ClearSensitiveState(SessionState state)
    {
        state.Nip = null;
        state.Environment = null;
        state.AccessToken = null;
        state.AccessTokenExpiry = null;
        state.RefreshToken = null;
        state.RefreshTokenExpiry = null;
        ClearOnlineSessionCore(state);
        state.CachedCertificates.Clear();
    }

    private sealed class SessionState
    {
        public object SyncRoot { get; } = new();
        public string? Nip { get; set; }
        public string? Environment { get; set; }
        public string? AccessToken { get; set; }
        public DateTime? AccessTokenExpiry { get; set; }
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiry { get; set; }
        public string? OnlineSessionReference { get; set; }
        public DateTime? OnlineSessionExpiry { get; set; }
        public byte[]? AesKey { get; set; }
        public byte[]? Iv { get; set; }
        public Dictionary<string, List<CertificateInfo>> CachedCertificates { get; } =
            new(StringComparer.OrdinalIgnoreCase);
    }
}
