using System.Security.Claims;
using FluentAssertions;
using KSeF.Backend.Models.Responses.Auth;
using KSeF.Backend.Models.Responses.Common;
using KSeF.Backend.Services.KSeF.Session;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace KSeF_Backend.Tests.Services;

public class KSeFSessionStoreTests
{
    private static ServiceProvider BuildProvider()
    {
        var services = new ServiceCollection();
        services.AddSingleton<ILoggerFactory>(NullLoggerFactory.Instance);
        services.AddHttpContextAccessor();
        services.AddSingleton<KSeFSessionStore>();

        // Mirrors the KSeFSessionManager registration in ServicesExtensions.RegisterSingletons:
        // resolve the session belonging to the caller's user id, never a single shared instance.
        services.AddScoped(sp =>
        {
            var userIdClaim = sp.GetRequiredService<IHttpContextAccessor>()
                .HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userId = int.TryParse(userIdClaim, out var id) ? id : 0;

            return sp.GetRequiredService<KSeFSessionStore>().GetSession(userId);
        });

        return services.BuildServiceProvider();
    }

    private static IServiceScope ScopeForUser(ServiceProvider provider, int userId)
    {
        var scope = provider.CreateScope();
        var accessor = scope.ServiceProvider.GetRequiredService<IHttpContextAccessor>();
        var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) }, "test");
        accessor.HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) };
        return scope;
    }

    [Fact]
    public void DifferentUsers_GetIsolatedSessions()
    {
        using var provider = BuildProvider();

        using var scope1 = ScopeForUser(provider, userId: 1);
        var session1 = scope1.ServiceProvider.GetRequiredService<KSeFSessionManager>();
        session1.SetAuthSession("1111111111", new TokenRedeemResponse
        {
            AccessToken = new TokenInfo { Token = "user1-token", ValidUntil = DateTime.UtcNow.AddHours(1) }
        });

        using var scope2 = ScopeForUser(provider, userId: 2);
        var session2 = scope2.ServiceProvider.GetRequiredService<KSeFSessionManager>();

        session2.Nip.Should().BeNull("user 2 must not see user 1's KSeF session");
        session2.AccessToken.Should().BeNull("user 2 must not inherit user 1's access token");
        session1.Nip.Should().Be("1111111111");
    }

    [Fact]
    public void SameUser_ReusesSessionAcrossRequests()
    {
        using var provider = BuildProvider();

        using (var scope1 = ScopeForUser(provider, userId: 42))
        {
            var session = scope1.ServiceProvider.GetRequiredService<KSeFSessionManager>();
            session.SetAuthSession("2222222222", new TokenRedeemResponse
            {
                AccessToken = new TokenInfo { Token = "user42-token", ValidUntil = DateTime.UtcNow.AddHours(1) }
            });
        }

        using var scope2 = ScopeForUser(provider, userId: 42);
        var sessionAgain = scope2.ServiceProvider.GetRequiredService<KSeFSessionManager>();

        sessionAgain.Nip.Should().Be("2222222222", "the same user's session must persist across separate requests");
    }
}
