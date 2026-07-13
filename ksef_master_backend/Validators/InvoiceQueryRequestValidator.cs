using FluentValidation;
using KSeF.Backend.Models.Requests;

namespace KSeF.Backend.Validators;

public class InvoiceQueryRequestValidator : AbstractValidator<InvoiceQueryRequest>
{
    private static readonly string[] ValidSubjectTypes = ["Subject1", "Subject2"];
    private static readonly string[] ValidDateTypes = ["Issue", "Invoicing", "PermanentStorage"];

    public InvoiceQueryRequestValidator()
    {
        RuleFor(x => x.SubjectType)
            .NotEmpty().WithMessage("SubjectType jest wymagany (Subject1 lub Subject2)")
            .Must(t => ValidSubjectTypes.Contains(t))
            .WithMessage("SubjectType musi być 'Subject1' (wystawione) lub 'Subject2' (odebrane)");

        RuleFor(x => x.DateRange)
            .NotNull().WithMessage("DateRange jest wymagany");

        When(x => x.DateRange != null, () =>
        {
            RuleFor(x => x.DateRange!.From)
                .NotEqual(default(DateTime)).WithMessage("DateRange.From jest wymagany");

            RuleFor(x => x.DateRange!.To)
                .NotEqual(default(DateTime)).WithMessage("DateRange.To jest wymagany");

            RuleFor(x => x.DateRange!)
                .Must(d => d.From <= d.To)
                .WithMessage("DateRange.From nie może być późniejszy niż DateRange.To")
                .Must(d => d.To <= d.From.AddMonths(3))
                .WithMessage("Zakres dat nie może przekraczać 3 miesięcy");

            RuleFor(x => x.DateRange!.DateType)
                .NotEmpty().WithMessage("DateRange.DateType jest wymagany")
                .Must(t => ValidDateTypes.Contains(t))
                .WithMessage($"DateRange.DateType musi być jednym z: {string.Join(", ", ValidDateTypes)}");
        });

        When(x => x.AmountFrom.HasValue && x.AmountTo.HasValue, () =>
        {
            RuleFor(x => x)
                .Must(x => x.AmountFrom <= x.AmountTo)
                .WithMessage("AmountFrom nie może być większy niż AmountTo");
        });

        When(x => x.MaxResults.HasValue, () =>
        {
            RuleFor(x => x.MaxResults!.Value)
                .InclusiveBetween(1, 50_000).WithMessage("MaxResults musi mieścić się w zakresie od 1 do 50000");
        });

        When(x => x.PageSize.HasValue, () =>
        {
            RuleFor(x => x.PageSize!.Value)
                .InclusiveBetween(10, 250).WithMessage("PageSize musi mieścić się w zakresie od 10 do 250");
        });

        RuleFor(x => x.ContractorNip)
            .Matches(@"^\d{10}$")
            .When(x => !string.IsNullOrWhiteSpace(x.ContractorNip))
            .WithMessage("ContractorNip musi składać się z 10 cyfr");

        RuleFor(x => x.ContractorName)
            .MaximumLength(512).WithMessage("ContractorName może mieć maksymalnie 512 znaków");

        RuleFor(x => x.InvoiceNumber)
            .MaximumLength(256).WithMessage("InvoiceNumber może mieć maksymalnie 256 znaków");

        RuleFor(x => x.Currency)
            .Matches(@"^[A-Za-z]{3}$")
            .When(x => !string.IsNullOrWhiteSpace(x.Currency))
            .WithMessage("Currency musi być trzyznakowym kodem waluty");
    }
}
