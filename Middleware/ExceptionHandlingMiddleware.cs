using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
using FluentValidation;
using KSeF.Backend.Infrastructure.KSeF;
using KSeF.Backend.Models.Common;

namespace KSeF.Backend.Middleware;

public class ExceptionHandlingMiddleware
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            _logger.LogDebug("Request cancelled by client: {Method} {Path}",
                context.Request.Method, context.Request.Path);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        if (context.Response.HasStarted)
        {
            _logger.LogWarning("Exception after response started: {Message}", exception.Message);
            return;
        }

        var (statusCode, error) = MapException(exception);

        if (statusCode >= 500)
            _logger.LogError(exception, "Unhandled exception [{Status}]: {Message}", statusCode, exception.Message);
        else
            _logger.LogWarning("Request error [{Status}]: {Message}", statusCode, exception.Message);

        context.Response.Clear();
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        var response = ApiResponse.Fail(error);
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions));
    }

    private static (int statusCode, object error) MapException(Exception exception) => exception switch
    {
        KSeFApiException ksef => (
            (int)(ksef.StatusCode ?? HttpStatusCode.BadGateway),
            (object)ksef.Message
        ),
        ValidationException validation => (
            StatusCodes.Status400BadRequest,
            (object)new
            {
                message = "Błąd walidacji",
                errors = validation.Errors.Select(e => new { field = e.PropertyName, message = e.ErrorMessage })
            }
        ),
        UnauthorizedAccessException => (StatusCodes.Status401Unauthorized, (object)"Brak autoryzacji"),
        ArgumentException arg => (StatusCodes.Status400BadRequest, (object)arg.Message),
        InvalidOperationException inv => (StatusCodes.Status400BadRequest, (object)inv.Message),
        HttpRequestException => (StatusCodes.Status502BadGateway, (object)"Błąd komunikacji z zewnętrznym serwisem"),
        _ => (StatusCodes.Status500InternalServerError, (object)"Wewnętrzny błąd serwera")
    };
}
