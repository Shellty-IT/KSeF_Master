using KSeF.Backend.Models.Requests;

namespace KSeF.Backend.Services.External;

public class ExternalDraftValidator
{
    private static readonly HashSet<string> ValidCurrencies = ["PLN", "EUR", "USD", "GBP"];

    public List<string> Validate(SmartQuoteImportRequest request)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(request.SmartQuoteId))
            errors.Add("smartQuoteId jest wymagany");

        if (string.IsNullOrWhiteSpace(request.OfferNumber))
            errors.Add("offerNumber jest wymagany");

        DateOnly issueDate = default;
        DateOnly dueDate = default;

        if (string.IsNullOrWhiteSpace(request.IssueDate) || !DateOnly.TryParse(request.IssueDate, out issueDate))
            errors.Add("issueDate jest wymagany w formacie YYYY-MM-DD");

        if (string.IsNullOrWhiteSpace(request.DueDate) || !DateOnly.TryParse(request.DueDate, out dueDate))
            errors.Add("dueDate jest wymagany w formacie YYYY-MM-DD");

        if (issueDate != default && dueDate != default && dueDate < issueDate)
            errors.Add("dueDate nie może być wcześniejszy niż issueDate");

        ValidateParty(request.Seller, "seller", errors);
        ValidateParty(request.Buyer, "buyer", errors);

        if (request.Items == null || request.Items.Count == 0)
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
            {
                var item = request.Items[i];
                if (string.IsNullOrWhiteSpace(item.Name))
                    errors.Add($"Pozycja {i + 1}: nazwa jest wymagana");
                if (item.Quantity <= 0)
                    errors.Add($"Pozycja {i + 1}: ilość musi być większa od 0");
                if (item.UnitPrice < 0)
                    errors.Add($"Pozycja {i + 1}: cena nie może być ujemna");
                if (item.TotalGross < 0)
                    errors.Add($"Pozycja {i + 1}: kwota brutto nie może być ujemna");
            }
        }

        if (request.TotalGross <= 0)
            errors.Add("totalGross musi być większy od 0");

        if (!ValidCurrencies.Contains(request.Currency.ToUpperInvariant()))
            errors.Add($"Nieobsługiwana waluta: {request.Currency}. Dozwolone: {string.Join(", ", ValidCurrencies)}");

        return errors;
    }

    private static void ValidateParty(SmartQuoteParty party, string prefix, List<string> errors)
    {
        if (string.IsNullOrWhiteSpace(party.Name))
            errors.Add($"{prefix}.name jest wymagany");

        if (string.IsNullOrWhiteSpace(party.Nip))
        {
            errors.Add($"{prefix}.nip jest wymagany");
        }
        else if (party.Nip.Length != 10 || !party.Nip.All(char.IsDigit))
        {
            errors.Add($"{prefix}.nip musi mieć dokładnie 10 cyfr");
        }

        if (string.IsNullOrWhiteSpace(party.Address))
            errors.Add($"{prefix}.address jest wymagany");

        if (string.IsNullOrWhiteSpace(party.City))
            errors.Add($"{prefix}.city jest wymagany");

        if (string.IsNullOrWhiteSpace(party.PostalCode))
            errors.Add($"{prefix}.postalCode jest wymagany");
    }
}
