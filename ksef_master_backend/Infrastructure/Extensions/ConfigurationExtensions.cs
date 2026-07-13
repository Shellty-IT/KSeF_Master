// Infrastructure/Extensions/ConfigurationExtensions.cs
namespace KSeF.Backend.Infrastructure.Extensions;

public static class ConfigurationExtensions
{
    public static WebApplicationBuilder AddAppConfiguration(this WebApplicationBuilder builder)
    {
        // Keep the default ASP.NET Core providers (including command-line arguments).
        // Local settings are optional and environment variables remain the final override.
        builder.Configuration.AddJsonFile(
            $"appsettings.{builder.Environment.EnvironmentName}.local.json",
            optional: true,
            reloadOnChange: false);

        if (builder.Environment.IsDevelopment())
            builder.Configuration.AddUserSecrets<Program>(optional: true);

        builder.Configuration.AddEnvironmentVariables();

        return builder;
    }
}
