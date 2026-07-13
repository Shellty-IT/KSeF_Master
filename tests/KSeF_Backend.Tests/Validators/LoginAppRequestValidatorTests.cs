using FluentAssertions;
using KSeF.Backend.Models.Requests;
using KSeF.Backend.Validators;
using Xunit;

namespace KSeF_Backend.Tests.Validators;

public class LoginAppRequestValidatorTests
{
    private readonly LoginAppRequestValidator _validator = new();

    [Fact]
    public void Valid_credentials_pass()
    {
        var result = _validator.Validate(new LoginAppRequest
        {
            Email = "user@example.com",
            Password = "valid-password"
        });

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Oversized_password_is_rejected_before_hash_verification()
    {
        var result = _validator.Validate(new LoginAppRequest
        {
            Email = "user@example.com",
            Password = new string('x', 129)
        });

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(error => error.PropertyName == "Password");
    }
}
