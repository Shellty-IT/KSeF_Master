using FluentValidation;
using KSeF.Backend.Models.Requests;

namespace KSeF.Backend.Validators;

public class LoginAppRequestValidator : AbstractValidator<LoginAppRequest>
{
    public LoginAppRequestValidator()
    {
        RuleFor(request => request.Email)
            .NotEmpty().WithMessage("Email jest wymagany")
            .EmailAddress().WithMessage("Nieprawidłowy format email")
            .MaximumLength(256).WithMessage("Email może mieć maksymalnie 256 znaków");

        RuleFor(request => request.Password)
            .NotEmpty().WithMessage("Hasło jest wymagane")
            .MaximumLength(128).WithMessage("Hasło może mieć maksymalnie 128 znaków");
    }
}
