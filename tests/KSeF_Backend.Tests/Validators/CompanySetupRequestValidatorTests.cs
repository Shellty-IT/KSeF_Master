using FluentAssertions;
using FluentValidation;
using KSeF.Backend.Models.Requests;
using KSeF.Backend.Validators;
using Xunit;

namespace KSeF_Backend.Tests.Validators;

public class CompanySetupRequestValidatorTests
{
    private readonly IValidator<CompanySetupRequest> _sut = new CompanySetupRequestValidator();

    private static CompanySetupRequest Valid() => new()
    {
        CompanyName = "Kowalski Sp. z o.o.",
        Nip = "5260001228",
        KsefToken = "TOKEN|nip",
        KsefEnvironment = "Test"
    };

    [Theory]
    [InlineData("Test")]
    [InlineData("Production")]
    public void Valid_environments_pass(string env)
    {
        var req = Valid();
        req.KsefEnvironment = env;
        _sut.Validate(req).IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("test")]       // lowercase — case-sensitive
    [InlineData("PRODUCTION")] // uppercase
    [InlineData("Staging")]
    [InlineData("")]
    public void Invalid_environment_fails(string env)
    {
        var req = Valid();
        req.KsefEnvironment = env;
        var result = _sut.Validate(req);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "KsefEnvironment");
    }

    [Fact]
    public void Empty_company_name_fails()
    {
        var req = Valid();
        req.CompanyName = "";
        var result = _sut.Validate(req);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "Nazwa firmy jest wymagana");
    }

    [Fact]
    public void Company_name_over_500_chars_fails()
    {
        var req = Valid();
        req.CompanyName = new string('X', 501);
        var result = _sut.Validate(req);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "Nazwa firmy nie może przekraczać 500 znaków");
    }

    [Theory]
    [InlineData("123456789")]   // 9 digits
    [InlineData("12345678901")] // 11 digits
    [InlineData("ABCDEFGHIJ")] // letters
    [InlineData("")]
    public void Invalid_nip_fails(string nip)
    {
        var req = Valid();
        req.Nip = nip;
        var result = _sut.Validate(req);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Nip");
    }

    [Fact]
    public void Token_without_pipe_fails()
    {
        var req = Valid();
        req.KsefToken = "NOPIPE";
        var result = _sut.Validate(req);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "Nieprawidłowy format tokenu KSeF");
    }
}
