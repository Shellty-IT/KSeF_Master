// Services/KSeF/Session/KSeFSessionStore.cs
using System.Collections.Concurrent;

namespace KSeF.Backend.Services.KSeF.Session;

/// <summary>
/// Holds one <see cref="KSeFSessionManager"/> per application user, keyed by user id.
/// Prevents KSeF access tokens / online-session keys from one user leaking into another
/// user's requests, which previously happened because KSeFSessionManager was a single
/// process-wide singleton shared by every logged-in user.
/// </summary>
public class KSeFSessionStore
{
    private readonly ConcurrentDictionary<int, KSeFSessionManager> _sessions = new();
    private readonly ILoggerFactory _loggerFactory;

    public KSeFSessionStore(ILoggerFactory loggerFactory)
    {
        _loggerFactory = loggerFactory;
    }

    public KSeFSessionManager GetSession(int userId) =>
        _sessions.GetOrAdd(userId, _ => new KSeFSessionManager(_loggerFactory.CreateLogger<KSeFSessionManager>()));
}
