// Infrastructure/Extensions/CorsExtensions.cs
namespace KSeF.Backend.Infrastructure.Extensions;

public static class CorsExtensions
{
    private static readonly string[] DefaultAllowedOrigins =
    [
        "https://ksef-master.shellty.pl"
    ];

    public static WebApplicationBuilder AddAppCors(this WebApplicationBuilder builder)
    {
        var allowedOrigins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>()?
            .Where(origin => !string.IsNullOrWhiteSpace(origin))
            .Select(origin => origin.Trim().TrimEnd('/'))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (allowedOrigins is null || allowedOrigins.Length == 0)
        {
            allowedOrigins = DefaultAllowedOrigins;
        }

        builder.Services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                policy
                    .WithOrigins(allowedOrigins)
                    .AllowAnyMethod()
                    .AllowAnyHeader();
            });
        });

        return builder;
    }
}
