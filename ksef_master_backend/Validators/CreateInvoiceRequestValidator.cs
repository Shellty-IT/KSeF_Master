using System.Globalization;
using FluentValidation;
using KSeF.Backend.Models.Requests;

namespace KSeF.Backend.Validators;

public class CreateInvoiceRequestValidator : AbstractValidator<CreateInvoiceRequest>
{
    public CreateInvoiceRequestValidator()
    {
        RuleFor(x => x.InvoiceNumber)
            .NotEmpty().WithMessage("Numer faktury jest wymagany");

        RuleFor(x => x.IssueDate)
            .NotEmpty().WithMessage("Data wystawienia jest wymagana")
            .Must(BeAValidDate).WithMessage("Data wystawienia musi być w formacie RRRR-MM-DD");

        RuleFor(x => x.SaleDate)
            .NotEmpty().WithMessage("Data sprzedaży jest wymagana")
            .Must(BeAValidDate).WithMessage("Data sprzedaży musi być w formacie RRRR-MM-DD");

        RuleFor(x => x.Seller)
            .NotNull().WithMessage("Dane sprzedawcy są wymagane");

        When(x => x.Seller != null, () =>
        {
            RuleFor(x => x.Seller!.Nip)
                .NotEmpty().WithMessage("NIP sprzedawcy jest wymagany");

            RuleFor(x => x.Seller!.Name)
                .NotEmpty().WithMessage("Nazwa sprzedawcy jest wymagana");

            RuleFor(x => x.Seller!.AddressLine1)
                .NotEmpty().WithMessage("Adres sprzedawcy jest wymagany");
        });

        RuleFor(x => x.Buyer)
            .NotNull().WithMessage("Dane nabywcy są wymagane");

        When(x => x.Buyer != null, () =>
        {
            RuleFor(x => x.Buyer!.Nip)
                .NotEmpty().WithMessage("NIP nabywcy jest wymagany");

            RuleFor(x => x.Buyer!.Name)
                .NotEmpty().WithMessage("Nazwa nabywcy jest wymagana");

            RuleFor(x => x.Buyer!.AddressLine1)
                .NotEmpty().WithMessage("Adres nabywcy jest wymagany");
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
        });
    }

    private static bool BeAValidDate(string date) =>
        DateTime.TryParseExact(date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _);
}