using System.Globalization;
using FluentValidation;
using KSeF.Backend.Models.Requests;

namespace KSeF.Backend.Validators;

public class GeneratePdfRequestValidator : AbstractValidator<GeneratePdfRequest>
{
    public GeneratePdfRequestValidator()
    {
        RuleFor(request => request.Source)
            .Equal("local").WithMessage("Obsługiwane jest wyłącznie źródło 'local'");

        RuleFor(request => request.KsefEnvironment)
            .Must(environment => environment is "Test" or "Production")
            .WithMessage("Nieprawidłowe środowisko KSeF");

        RuleFor(request => request.InvoiceNumber)
            .NotEmpty().WithMessage("Numer faktury jest wymagany")
            .MaximumLength(256).WithMessage("Numer faktury może mieć maksymalnie 256 znaków");

        RuleFor(request => request.IssueDate)
            .NotEmpty().WithMessage("Data wystawienia jest wymagana")
            .Must(IsIsoDate).WithMessage("Data wystawienia musi mieć format RRRR-MM-DD");

        RuleFor(request => request.InvoiceHash)
            .Must(IsSha256Base64).WithMessage("Hash faktury musi być skrótem SHA-256 w formacie Base64");

        RuleFor(request => request.Seller)
            .NotNull().WithMessage("Dane sprzedawcy są wymagane");

        When(request => request.Seller is not null, () =>
        {
            RuleFor(request => request.Seller!.Nip)
                .Matches(@"^\d{10}$").WithMessage("NIP sprzedawcy musi składać się z 10 cyfr");
            RuleFor(request => request.Seller!.Name).MaximumLength(300);
            RuleFor(request => request.Seller!.Address).MaximumLength(500);
        });

        RuleFor(request => request.Items)
            .Must(items => items is null || items.Count <= 1000)
            .WithMessage("PDF może zawierać maksymalnie 1000 pozycji");
    }

    private static bool IsIsoDate(string? value) =>
        DateOnly.TryParseExact(
            value,
            "yyyy-MM-dd",
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out _);

    private static bool IsSha256Base64(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        try
        {
            return Convert.FromBase64String(value).Length == 32;
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
