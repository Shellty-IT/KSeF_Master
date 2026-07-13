using System.Diagnostics;

namespace KSeF.Backend.Infrastructure.KSeF;

/// <summary>
/// Logs KSeF request metadata without persisting credentials or invoice content.
/// </summary>
public class KSeFHttpLoggingHandler : DelegatingHandler
{
    private static readonly HashSet<string> SensitiveHeaders = new(StringComparer.OrdinalIgnoreCase)
    {
        "Authorization",
        "Proxy-Authorization",
        "SessionToken",
        "Cookie",
        "Set-Cookie",
        "X-API-Key"
    };

    private readonly ILogger<KSeFHttpLoggingHandler> _logger;

    public KSeFHttpLoggingHandler(ILogger<KSeFHttpLoggingHandler> logger)
    {
        _logger = logger;
    }

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        var requestId = Guid.NewGuid().ToString("N")[..8];
        var stopwatch = Stopwatch.StartNew();

        _logger.LogDebug("[{RequestId}] → {Method} {Uri}",
            requestId, request.Method, request.RequestUri);

        foreach (var header in request.Headers)
        {
            var value = SensitiveHeaders.Contains(header.Key)
                ? "[REDACTED]"
                : string.Join(", ", header.Value);
            _logger.LogDebug("[{RequestId}] Header {Name}: {Value}",
                requestId, header.Key, value);
        }

        if (request.Content is not null)
        {
            _logger.LogDebug(
                "[{RequestId}] Request content: {ContentType}, {ContentLength} bytes",
                requestId,
                request.Content.Headers.ContentType?.MediaType ?? "unknown",
                request.Content.Headers.ContentLength);
        }

        try
        {
            var response = await base.SendAsync(request, cancellationToken);
            stopwatch.Stop();

            _logger.LogDebug(
                "[{RequestId}] ← {StatusCode} ({Status}) in {Elapsed}ms; content: {ContentType}, {ContentLength} bytes",
                requestId,
                (int)response.StatusCode,
                response.StatusCode,
                stopwatch.ElapsedMilliseconds,
                response.Content.Headers.ContentType?.MediaType ?? "unknown",
                response.Content.Headers.ContentLength);

            return response;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "[{RequestId}] Request failed after {Elapsed}ms",
                requestId, stopwatch.ElapsedMilliseconds);
            throw;
        }
    }
}
