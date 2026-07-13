// Middleware/ApiKeyAuthAttribute.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Cryptography;
using System.Text;

namespace KSeF.Backend.Middleware;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class ApiKeyAuthAttribute : Attribute, IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var configuration = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
        var expectedKey = configuration.GetValue<string>("SmartQuote:ApiKey");

        if (string.IsNullOrEmpty(expectedKey))
        {
            context.Result = new JsonResult(new { success = false, message = "API key not configured on server" })
            {
                StatusCode = StatusCodes.Status500InternalServerError
            };
            return;
        }

        if (!context.HttpContext.Request.Headers.TryGetValue("X-API-Key", out var providedKey) ||
            providedKey.Count != 1 ||
            !KeysMatch(providedKey[0], expectedKey))
        {
            context.Result = new JsonResult(new { success = false, message = "Invalid API key" })
            {
                StatusCode = StatusCodes.Status401Unauthorized
            };
            return;
        }

        await next();
    }

    private static bool KeysMatch(string? providedKey, string expectedKey)
    {
        if (providedKey is null) return false;

        var providedBytes = Encoding.UTF8.GetBytes(providedKey);
        var expectedBytes = Encoding.UTF8.GetBytes(expectedKey);
        return providedBytes.Length == expectedBytes.Length &&
               CryptographicOperations.FixedTimeEquals(providedBytes, expectedBytes);
    }
}
