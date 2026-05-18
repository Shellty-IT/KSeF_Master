using FluentAssertions;
using FluentValidation;
using KSeF.Backend.Models.Requests;
using KSeF.Backend.Validators;
using Xunit;

namespace KSeF_Backend.Tests.Validators;

public class LoginRequestValidatorTests
{
    private readonly IValidator<LoginRequest> _sut = new LoginRequestValidator();

    [Theory]
    [InlineData("1234567890", "ABC12345-00-XXXXXXXXXX-XXXXXXXXXX-00|nip-1234567890|hash")]
    [InlineData("5260001228", "TOKEN|nip")]
    public void Valid_request_passes(string nip, string token)
    {
        var result = _sut.Validate(new LoginRequest { Nip = nip, KsefToken = token });
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Missing_nip_fails_with_expected_message()
    {
        var result = _sut.Validate(new LoginRequest { Nip = "", KsefToken = "A|B" });
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "NIP jest wymagany");
    }

    [Theory]
    [InlineData("123456789")]   // 9 digits
    [InlineData("12345678901")] // 11 digits
    [InlineData("123456789A")] // non-digit
    public void Invalid_nip_format_fails(string nip)
    {
        var result = _sut.Validate(new LoginRequest { Nip = nip, KsefToken = "A|B" });
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Nip");
    }

    [Fact]
    public void Missing_token_fails_with_expected_message()
    {
        var result = _sut.Validate(new LoginRequest { Nip = "1234567890", KsefToken = "" });
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "Token KSeF jest wymagany");
    }

    [Fact]
    public void Token_without_pipe_fails()
    {
        var result = _sut.Validate(new LoginRequest { Nip = "1234567890", KsefToken = "TOKENWITHOUTSEPARATOR" });
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "Nieprawidłowy format tokenu KSeF");
    }
}
