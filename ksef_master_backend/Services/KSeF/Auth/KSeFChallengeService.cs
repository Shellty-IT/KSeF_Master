using System.Globalization;
using System.Text.Json.Nodes;
using KSeF.Backend.Infrastructure.KSeF;
using KSeF.Backend.Services.Interfaces.KSeF;

namespace KSeF.Backend.Services.KSeF.Auth;

public class KSeFChallengeService : IKSeFChallengeService
{
    public async Task<(string challenge, long timestampMs)> GetChallengeAsync(
        HttpClient client,
        CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "auth/challenge");
        using var response = await client.SendAsync(request, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var error = KSeFErrorParser.Parse(responseBody);
            throw new KSeFApiException($"Challenge request failed: {error}", response.StatusCode);
        }

        var jsonNode = JsonNode.Parse(responseBody);
        var challenge = jsonNode?["challenge"]?.GetValue<string>()
            ?? throw new InvalidOperationException("Challenge not found in response");
        var timestampString = jsonNode["timestamp"]?.GetValue<string>();

        if (string.IsNullOrEmpty(timestampString) ||
            !DateTimeOffset.TryParse(
                timestampString,
                CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal,
                out var timestamp))
        {
            throw new InvalidOperationException("Challenge response contains an invalid timestamp");
        }

        return (challenge, timestamp.ToUnixTimeMilliseconds());
    }
}
