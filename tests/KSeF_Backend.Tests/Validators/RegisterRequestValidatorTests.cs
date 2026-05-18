using FluentAssertions;
using FluentValidation;
using KSeF.Backend.Models.Requests;
using KSeF.Backend.Validators;
using Xunit;

namespace KSeF_Backend.Tests.Validators;

public class RegisterRequestValidatorTests
{
    private readonly IValidator<RegisterRequest> _sut = new RegisterRequestValidator();

    private static RegisterRequest Valid() => new()
    {
        Email = "jan.kowalski@example.com",
        Password = "StrongP@ss1",
        Name = "Jan Kowalski"
    };

    [Fact]
    public void Valid_request_passes()
    {
        _sut.Validate(Valid()).IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-an-email")]
    [InlineData("missing@")]
    [InlineData("@nodomain.com")]
    public void Invalid_email_fails(string email)
    {
        var req = Valid();
        req.Email = email;
        var result = _sut.Validate(req);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Email");
    }

    [Fact]
    public void Empty_password_fails_with_required_message()
    {
        var req = Valid();
        req.Password = "";
        var result = _sut.Validate(req);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "Hasło jest wymagane");
    }

    [Fact]
    public void Short_password_fails()
    {
        var req = Valid();
        req.Password = "1234567"; // 7 chars — below minimum
        var result = _sut.Validate(req);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "Hasło musi mieć co najmniej 8 znaków");
    }

    [Fact]
    public void Exactly_8_char_password_passes()
    {
        var req = Valid();
        req.Password = "12345678";
        _sut.Validate(req).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Empty_name_fails()
    {
        var req = Valid();
        req.Name = "";
        var result = _sut.Validate(req);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "Imię i nazwisko jest wymagane");
    }

    [Fact]
    public void Name_over_200_chars_fails()
    {
        var req = Valid();
        req.Name = new string('A', 201);
        var result = _sut.Validate(req);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "Imię i nazwisko nie może przekraczać 200 znaków");
    }

    [Fact]
    public void Name_exactly_200_chars_passes()
    {
        var req = Valid();
        req.Name = new string('A', 200);
        _sut.Validate(req).IsValid.Should().BeTrue();
    }
}
