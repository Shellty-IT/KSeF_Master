using KSeF.Backend.Models.Configuration;
using KSeF.Backend.Services.Interfaces.KSeF;

namespace KSeF.Backend.Services.KSeF.Common;

public class KSeFEnvironmentService : IKSeFEnvironmentService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<KSeFEnvironmentService> _logger;

    public KSeFEnvironmentService(
        IConfiguration configuration,
        ILogger<KSeFEnvironmentService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public KSeFEnvironmentConfig GetEnvironmentConfig(string environment)
    {
        var config = new KSeFEnvironmentConfig();
        
        var section = _configuration.GetSection($"KSeF:Environments:{environment}");
        
        if (!section.Exists())
        {
            throw new ArgumentException(
                $"Nieznane środowisko KSeF: '{environment}'",
                nameof(environment));
        }

        config.ApiBaseUrl = section.GetValue<string>("ApiBaseUrl")
            ?? throw new InvalidOperationException(
                $"KSeF:Environments:{environment}:ApiBaseUrl is not configured.");
        config.AppUrl = section.GetValue<string>("AppUrl")
            ?? throw new InvalidOperationException(
                $"KSeF:Environments:{environment}:AppUrl is not configured.");
        config.QrBaseUrl = section.GetValue<string>("QrBaseUrl")
            ?? throw new InvalidOperationException(
                $"KSeF:Environments:{environment}:QrBaseUrl is not configured.");

        _logger.LogDebug(
            "KSeF environment '{Environment}' config loaded: API={ApiUrl}",
            environment, config.ApiBaseUrl);

        return config;
    }

    public string GetApiBaseUrl(string environment)
    {
        return GetEnvironmentConfig(environment).ApiBaseUrl;
    }

    public string GetAppUrl(string environment)
    {
        return GetEnvironmentConfig(environment).AppUrl;
    }

    public string GetQrBaseUrl(string environment)
    {
        return GetEnvironmentConfig(environment).QrBaseUrl;
    }
}
