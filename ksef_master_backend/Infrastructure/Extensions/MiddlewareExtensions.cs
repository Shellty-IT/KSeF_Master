using KSeF.Backend.Middleware;

namespace KSeF.Backend.Infrastructure.Extensions;

public static class MiddlewareExtensions
{
    public static IApplicationBuilder UseAppMiddleware(this IApplicationBuilder app)
    {
        app.UseMiddleware<ExceptionHandlingMiddleware>();
        app.UseMiddleware<RequestLoggingMiddleware>();
        return app;
    }
}
