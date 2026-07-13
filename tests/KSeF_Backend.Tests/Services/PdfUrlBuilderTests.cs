using FluentAssertions;
using KSeF.Backend.Models.Configuration;
using KSeF.Backend.Services.Interfaces.KSeF;
using KSeF.Backend.Services.Pdf;
using Xunit;

namespace KSeF_Backend.Tests.Services;

public class PdfUrlBuilderTests
{
    private readonly PdfUrlBuilder _builder = new(new TestEnvironmentService());

    [Fact]
    public void Verification_url_uses_requested_environment_and_canonical_values()
    {
        var hash = Convert.ToBase64String(Enumerable.Range(0, 32).Select(value => (byte)value).ToArray());

        var result = _builder.BuildVerificationUrl(
            "5260001228", "2026-07-13", hash, "Production");

        result.Should().StartWith("https://qr.ksef.example/client-app/invoice/5260001228/13-07-2026/");
        result.Should().NotContain("=");
    }

    [Theory]
    [InlineData("bad-nip", "2026-07-13", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")]
    [InlineData("5260001228", "13.07.2026", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")]
    [InlineData("5260001228", "2026-07-13", "not-base64")]
    public void Invalid_qr_input_is_rejected(string nip, string date, string hash)
    {
        _builder.BuildVerificationUrl(nip, date, hash, "Test").Should().BeEmpty();
    }

    private sealed class TestEnvironmentService : IKSeFEnvironmentService
    {
        public KSeFEnvironmentConfig GetEnvironmentConfig(string environment) => throw new NotSupportedException();
        public string GetApiBaseUrl(string environment) => throw new NotSupportedException();
        public string GetAppUrl(string environment) => throw new NotSupportedException();
        public string GetQrBaseUrl(string environment) => environment switch
        {
            "Production" => "https://qr.ksef.example/",
            "Test" => "https://qr-test.ksef.example/",
            _ => throw new ArgumentException("Unknown environment", nameof(environment))
        };
    }
}
