using System.Security.Claims;
using FluentAssertions;
using KSeF.Backend.Models.Responses.Auth;
using KSeF.Backend.Models.Responses.Common;
using KSeF.Backend.Services.KSeF.Session;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace KSeF_Backend.Tests.Services;

public class KSeFSessionManagerTests
{
    private readonly HttpContextAccessor _httpContextAccessor = new();
    private readonly KSeFSessionManager _sut;

    public KSeFSessionManagerTests()
    {
        _sut = new KSeFSessionManager(
            _httpContextAccessor,
            NullLogger<KSeFSessionManager>.Instance);
    }

    [Fact]
    public void Sessions_are_isolated_by_application_user()
    {
        SetCurrentUser(101);
        _sut.SetAuthSession("1111111111", Tokens("user-one"), "Test");
        _sut.SetOnlineSession("session-one", DateTime.UtcNow.AddHours(1), [1, 2], [3, 4]);

        SetCurrentUser(202);
        _sut.IsAuthenticated.Should().BeFalse();
        _sut.SetAuthSession("2222222222", Tokens("user-two"), "Production");

        _sut.Nip.Should().Be("2222222222");
        _sut.AccessToken.Should().Be("user-two");
        _sut.Environment.Should().Be("Production");
        _sut.HasActiveOnlineSession.Should().BeFalse();

        SetCurrentUser(101);
        _sut.Nip.Should().Be("1111111111");
        _sut.AccessToken.Should().Be("user-one");
        _sut.Environment.Should().Be("Test");
        _sut.SessionReferenceNumber.Should().Be("session-one");
    }

    [Fact]
    public void Clearing_one_session_does_not_disconnect_another_user()
    {
        SetCurrentUser(101);
        _sut.SetAuthSession("1111111111", Tokens("user-one"), "Test");
        SetCurrentUser(202);
        _sut.SetAuthSession("2222222222", Tokens("user-two"), "Production");

        SetCurrentUser(101);
        _sut.ClearAuthSession();
        _sut.IsAuthenticated.Should().BeFalse();

        SetCurrentUser(202);
        _sut.IsAuthenticated.Should().BeTrue();
        _sut.AccessToken.Should().Be("user-two");
    }

    [Fact]
    public void Access_without_an_authenticated_user_is_rejected()
    {
        _httpContextAccessor.HttpContext = new DefaultHttpContext();

        var act = () => _sut.IsAuthenticated;

        act.Should().Throw<UnauthorizedAccessException>();
    }

    private void SetCurrentUser(int userId)
    {
        var identity = new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, userId.ToString())],
            "test");
        _httpContextAccessor.HttpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(identity)
        };
    }

    private static TokenRedeemResponse Tokens(string accessToken) => new()
    {
        AccessToken = new TokenInfo
        {
            Token = accessToken,
            ValidUntil = DateTime.UtcNow.AddHours(1)
        },
        RefreshToken = new TokenInfo
        {
            Token = $"refresh-{accessToken}",
            ValidUntil = DateTime.UtcNow.AddDays(1)
        }
    };
}
