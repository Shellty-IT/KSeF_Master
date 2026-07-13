using System.Net.Http.Headers;
using System.Text.Json;
using KSeF.Backend.Infrastructure.KSeF;
using KSeF.Backend.Models.Responses.Auth;
using KSeF.Backend.Services.Interfaces.KSeF;

namespace KSeF.Backend.Services.KSeF.Auth;

public class KSeFAuthRedeemService : IKSeFAuthRedeemService
{
    private static readonly JsonSerializerOptions JsonOptions =
        new() { PropertyNameCaseInsensitive = true };

    private readonly ILogger<KSeFAuthRedeemService> _logger;

    public KSeFAuthRedeemService(ILogger<KSeFAuthRedeemService> logger)
    {
        _logger = logger;
    }

    public async Task<TokenRedeemResponse?> RedeemTokenAsync(
        HttpClient client,
        string authenticationToken,
        CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "auth/token/redeem");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", authenticationToken);

        using var response = await client.SendAsync(request, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        _logger.LogInformation("Redeem response: {Status}", response.StatusCode);

        if (!response.IsSuccessStatusCode)
        {
            var error = KSeFErrorParser.Parse(responseBody);
            throw new KSeFApiException($"Token redeem failed: {error}", response.StatusCode);
        }

        var result = JsonSerializer.Deserialize<TokenRedeemResponse>(responseBody, JsonOptions);
        if (result?.AccessToken == null)
        {
            _logger.LogError("Token redeem response missing accessToken");
            return null;
        }

        return result;
    }
}
