using KSeF.Backend.Services.Interfaces.KSeF;

using System.Globalization;

namespace KSeF.Backend.Services.Pdf;

public class PdfUrlBuilder
{
    private readonly IKSeFEnvironmentService _environmentService;

    public PdfUrlBuilder(IKSeFEnvironmentService environmentService)
    {
        _environmentService = environmentService;
    }

    public string BuildVerificationUrl(string sellerNip, string issueDate, string invoiceHash, string environment)
    {
        if (!IsNip(sellerNip))
            return string.Empty;

        var formattedDate = FormatDateForUrl(issueDate);
        var hashBase64Url = ConvertToBase64Url(invoiceHash);
        if (formattedDate is null || hashBase64Url is null)
            return string.Empty;

        var baseUrl = _environmentService.GetQrBaseUrl(environment).TrimEnd('/');

        return $"{baseUrl}/client-app/invoice/{sellerNip}/{formattedDate}/{hashBase64Url}";
    }

    public string BuildQrUrl(string sellerNip, string issueDate, string invoiceHash, string environment)
    {
        if (!IsNip(sellerNip))
            return string.Empty;

        var formattedDate = FormatDateForUrl(issueDate);
        var hashBase64Url = ConvertToBase64Url(invoiceHash);
        if (formattedDate is null || hashBase64Url is null)
            return string.Empty;

        var baseUrl = _environmentService.GetQrBaseUrl(environment).TrimEnd('/');

        return $"{baseUrl}/{sellerNip}/{formattedDate}/{hashBase64Url}";
    }

    private static string? FormatDateForUrl(string issueDate)
    {
        return DateOnly.TryParseExact(
            issueDate,
            "yyyy-MM-dd",
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out var date)
            ? date.ToString("dd-MM-yyyy", CultureInfo.InvariantCulture)
            : null;
    }

    private static string? ConvertToBase64Url(string base64)
    {
        try
        {
            var hashBytes = Convert.FromBase64String(base64);
            if (hashBytes.Length != 32)
                return null;

            return Convert.ToBase64String(hashBytes)
                .Replace("+", "-")
                .Replace("/", "_")
                .TrimEnd('=');
        }
        catch (FormatException)
        {
            return null;
        }
    }

    private static bool IsNip(string nip) =>
        nip.Length == 10 && nip.All(char.IsDigit);
}
