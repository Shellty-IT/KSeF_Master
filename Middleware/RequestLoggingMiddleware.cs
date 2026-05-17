using System.Diagnostics;

namespace KSeF.Backend.Middleware;

public class RequestLoggingMiddleware
{
    private static readonly string[] SkippedPaths = ["/health", "/healthz", "/favicon.ico"];

    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? string.Empty;

        if (SkippedPaths.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase)))
        {
            await _next(context);
            return;
        }

        var method = context.Request.Method;
        var query = context.Request.QueryString.HasValue ? context.Request.QueryString.Value : string.Empty;
        var sw = Stopwatch.StartNew();

        _logger.LogInformation("→ {Method} {Path}{Query}", method, path, query);

        try
        {
            await _next(context);
        }
        finally
        {
            sw.Stop();
            _logger.LogInformation("← {Method} {Path} {Status} ({Duration}ms)",
                method, path, context.Response.StatusCode, sw.ElapsedMilliseconds);
        }
    }
}
