using System.Globalization;
using FluentValidation;
using KSeF.Backend.Models.Requests;

namespace KSeF.Backend.Validators;

public class CreateInvoiceRequestValidator : AbstractValidator<CreateInvoiceRequest>
{
    public CreateInvoiceRequestValidator()
    {
        RuleFor(x => x.InvoiceNumber)
            .NotEmpty().WithMessage("Numer faktury jest wymagany")
            .MaximumLength(256).WithMessage("Numer faktury może mieć maksymalnie 256 znaków");

        RuleFor(x => x.IssueDate)
            .NotEmpty().WithMessage("Data wystawienia jest wymagana")
            .Must(IsIsoDate).WithMessage("Data wystawienia musi być w formacie RRRR-MM-DD");

        RuleFor(x => x.SaleDate)
            .NotEmpty().WithMessage("Data sprzedaży jest wymagana")
            .Must(IsIsoDate).WithMessage("Data sprzedaży musi być w formacie RRRR-MM-DD");

        RuleFor(x => x.Currency)
            .NotEmpty().WithMessage("Waluta jest wymagana")
            .Matches(@"^[A-Z]{3}$").WithMessage("Waluta musi być trzyznakowym kodem ISO zapisanym wielkimi literami");

        RuleFor(x => x.Seller)
            .NotNull().WithMessage("Dane sprzedawcy są wymagane");

        When(x => x.Seller != null, () =>
        {
            RuleFor(x => x.Seller!.Nip)
                .NotEmpty().WithMessage("NIP sprzedawcy jest wymagany")
                .Matches(@"^\d{10}$").WithMessage("NIP sprzedawcy musi składać się z 10 cyfr");

            RuleFor(x => x.Seller!.Name)
                .NotEmpty().WithMessage("Nazwa sprzedawcy jest wymagana");

            RuleFor(x => x.Seller!.AddressLine1)
                .NotEmpty().WithMessage("Adres sprzedawcy jest wymagany");

            RuleFor(x => x.Seller!.CountryCode)
                .Matches(@"^[A-Z]{2}$").WithMessage("Kod kraju sprzedawcy musi mieć format ISO alfa-2");
        });

        RuleFor(x => x.Buyer)
            .NotNull().WithMessage("Dane nabywcy są wymagane");

        When(x => x.Buyer != null, () =>
        {
            RuleFor(x => x.Buyer!.Nip)
                .NotEmpty().WithMessage("NIP nabywcy jest wymagany")
                .Matches(@"^\d{10}$").WithMessage("NIP nabywcy musi składać się z 10 cyfr");

            RuleFor(x => x.Buyer!.Name)
                .NotEmpty().WithMessage("Nazwa nabywcy jest wymagana");

            RuleFor(x => x.Buyer!.AddressLine1)
                .NotEmpty().WithMessage("Adres nabywcy jest wymagany");

            RuleFor(x => x.Buyer!.CountryCode)
                .Matches(@"^[A-Z]{2}$").WithMessage("Kod kraju nabywcy musi mieć format ISO alfa-2");
        });

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Faktura musi zawierać przynajmniej jedną pozycję");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Nazwa pozycji jest wymagana");

            item.RuleFor(x => x.Quantity)
                .GreaterThan(0).WithMessage("Ilość musi być większa od 0");

            item.RuleFor(x => x.UnitPriceNet)
                .GreaterThanOrEqualTo(0).WithMessage("Cena nie może być ujemna");

            item.RuleFor(x => x.DiscountPercent)
                .InclusiveBetween(0, 100).WithMessage("Rabat musi mieścić się w zakresie od 0 do 100%");

            item.RuleFor(x => x.VatRate)
                .Must(IsSupportedVatRate).WithMessage("Nieobsługiwana stawka VAT");
        });
    }

    private static bool IsIsoDate(string value) =>
        DateOnly.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _);

    private static bool IsSupportedVatRate(string? value) =>
        !string.IsNullOrWhiteSpace(value) && value.Trim().ToLowerInvariant() is
            "23" or "22" or "8" or "7" or "5" or "4" or "3" or "0" or "zw" or "oo" or "np" or "np i" or "np ii";
}
