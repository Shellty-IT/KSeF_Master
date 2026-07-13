using System.Globalization;
using KSeF.Backend.Models.Requests;

namespace KSeF.Backend.Services.External;

public class ExternalDraftValidator
{
    private const decimal AmountTolerance = 0.02m;
    private static readonly HashSet<string> ValidCurrencies =
        new(StringComparer.OrdinalIgnoreCase) { "PLN", "EUR", "USD", "GBP" };
    private static readonly HashSet<int> ValidVatRates = [0, 5, 8, 23];

    public List<string> Validate(SmartQuoteImportRequest request)
    {
        var errors = new List<string>();

        ValidateRequiredLength(request.SmartQuoteId, "smartQuoteId", 128, errors);
        ValidateRequiredLength(request.OfferNumber, "offerNumber", 64, errors);

        var issueDateIsValid = TryParseIsoDate(request.IssueDate, out var issueDate);
        if (!issueDateIsValid)
            errors.Add("issueDate jest wymagany w formacie YYYY-MM-DD");

        var dueDateIsValid = TryParseIsoDate(request.DueDate, out var dueDate);
        if (!dueDateIsValid)
            errors.Add("dueDate jest wymagany w formacie YYYY-MM-DD");

        if (issueDateIsValid && dueDateIsValid && dueDate < issueDate)
            errors.Add("dueDate nie może być wcześniejszy niż issueDate");

        ValidateParty(request.Seller, "seller", errors);
        ValidateParty(request.Buyer, "buyer", errors);

        if (request.Items is null || request.Items.Count == 0)
        {
            errors.Add("Wymagana minimum 1 pozycja");
        }
        else if (request.Items.Count > 500)
        {
            errors.Add("Oferta może zawierać maksymalnie 500 pozycji");
        }
        else
        {
            for (var i = 0; i < request.Items.Count; i++)
                ValidateItem(request.Items[i], i + 1, errors);

            ValidateDocumentTotals(request, errors);
        }

        if (string.IsNullOrWhiteSpace(request.Currency) || !ValidCurrencies.Contains(request.Currency))
            errors.Add($"Nieobsługiwana waluta: {request.Currency}. Dozwolone: {string.Join(", ", ValidCurrencies)}");

        if (request.PaymentDays is < 0 or > 3650)
            errors.Add("paymentDays musi mieścić się w zakresie od 0 do 3650");

        return errors;
    }

    private static void ValidateParty(SmartQuoteParty? party, string prefix, List<string> errors)
    {
        if (party is null)
        {
            errors.Add($"{prefix} jest wymagany");
            return;
        }

        ValidateRequiredLength(party.Name, $"{prefix}.name", 300, errors);

        if (string.IsNullOrWhiteSpace(party.Nip))
            errors.Add($"{prefix}.nip jest wymagany");
        else if (party.Nip.Length != 10 || !party.Nip.All(char.IsDigit))
            errors.Add($"{prefix}.nip musi mieć dokładnie 10 cyfr");

        ValidateRequiredLength(party.Address, $"{prefix}.address", 300, errors);
        ValidateRequiredLength(party.City, $"{prefix}.city", 100, errors);
        ValidateRequiredLength(party.PostalCode, $"{prefix}.postalCode", 10, errors);
    }

    private static void ValidateItem(SmartQuoteItem item, int position, List<string> errors)
    {
        ValidateRequiredLength(item.Name, $"Pozycja {position}: nazwa", 300, errors);

        if (item.Description?.Length > 2000)
            errors.Add($"Pozycja {position}: opis może mieć maksymalnie 2000 znaków");
        if (item.Unit?.Length > 32)
            errors.Add($"Pozycja {position}: jednostka może mieć maksymalnie 32 znaki");
        if (item.Quantity <= 0)
            errors.Add($"Pozycja {position}: ilość musi być większa od 0");
        if (item.UnitPrice < 0)
            errors.Add($"Pozycja {position}: cena nie może być ujemna");
        if (item.Discount is < 0 or > 100)
            errors.Add($"Pozycja {position}: rabat musi mieścić się w zakresie od 0 do 100%");
        if (!ValidVatRates.Contains(item.VatRate))
            errors.Add($"Pozycja {position}: nieobsługiwana stawka VAT {item.VatRate}");

        if (item.Quantity <= 0 || item.UnitPrice < 0 || item.Discount is < 0 or > 100 ||
            !ValidVatRates.Contains(item.VatRate))
            return;

        var expectedNet = RoundMoney(item.Quantity * item.UnitPrice * (1m - item.Discount / 100m));
        var expectedVat = RoundMoney(expectedNet * item.VatRate / 100m);
        var expectedGross = expectedNet + expectedVat;

        ValidateAmount(item.TotalNet, expectedNet, $"Pozycja {position}: totalNet", errors);
        ValidateAmount(item.TotalVat, expectedVat, $"Pozycja {position}: totalVat", errors);
        ValidateAmount(item.TotalGross, expectedGross, $"Pozycja {position}: totalGross", errors);
    }

    private static void ValidateDocumentTotals(SmartQuoteImportRequest request, List<string> errors)
    {
        var expectedNet = RoundMoney(request.Items.Sum(item => item.TotalNet));
        var expectedVat = RoundMoney(request.Items.Sum(item => item.TotalVat));
        var expectedGross = RoundMoney(request.Items.Sum(item => item.TotalGross));

        ValidateAmount(request.TotalNet, expectedNet, "totalNet", errors);
        ValidateAmount(request.TotalVat, expectedVat, "totalVat", errors);
        ValidateAmount(request.TotalGross, expectedGross, "totalGross", errors);
    }

    private static void ValidateAmount(
        decimal actual,
        decimal expected,
        string field,
        List<string> errors)
    {
        if (actual < 0 || Math.Abs(actual - expected) > AmountTolerance)
            errors.Add($"{field} nie zgadza się z wyliczoną wartością {expected:F2}");
    }

    private static void ValidateRequiredLength(
        string? value,
        string field,
        int maximumLength,
        List<string> errors)
    {
        if (string.IsNullOrWhiteSpace(value))
            errors.Add($"{field} jest wymagany");
        else if (value.Length > maximumLength)
            errors.Add($"{field} może mieć maksymalnie {maximumLength} znaków");
    }

    private static bool TryParseIsoDate(string? value, out DateOnly date) =>
        DateOnly.TryParseExact(
            value,
            "yyyy-MM-dd",
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out date);

    private static decimal RoundMoney(decimal value) =>
        Math.Round(value, 2, MidpointRounding.AwayFromZero);
}
