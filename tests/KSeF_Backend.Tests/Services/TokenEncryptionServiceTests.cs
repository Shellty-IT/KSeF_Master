using System.Security.Cryptography;
using System.Text;
using FluentAssertions;
using KSeF.Backend.Services.Auth;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace KSeF_Backend.Tests.Services;

public class TokenEncryptionServiceTests
{
    private const string Key = "test-key-with-enough-entropy-for-repeatable-tests";

    [Fact]
    public void Encrypt_and_decrypt_round_trip_uses_authenticated_format()
    {
        var sut = CreateService(Key);

        var encrypted = sut.Encrypt("sensitive KSeF token");

        encrypted.Should().StartWith("v2:");
        sut.Decrypt(encrypted).Should().Be("sensitive KSeF token");
    }

    [Fact]
    public void Encrypt_uses_a_fresh_nonce_for_every_value()
    {
        var sut = CreateService(Key);

        var first = sut.Encrypt("same value");
        var second = sut.Encrypt("same value");

        first.Should().NotBe(second);
    }

    [Fact]
    public void Decrypt_rejects_tampered_authenticated_value()
    {
        var sut = CreateService(Key);
        var encrypted = sut.Encrypt("sensitive value");
        var payload = Convert.FromBase64String(encrypted[3..]);
        payload[^1] ^= 0x01;
        var tampered = "v2:" + Convert.ToBase64String(payload);

        var act = () => sut.Decrypt(tampered);

        act.Should().Throw<CryptographicException>();
    }

    [Fact]
    public void Decrypt_supports_legacy_cbc_values()
    {
        var sut = CreateService(Key);
        var legacy = EncryptLegacyCbc("legacy certificate", Key);

        sut.Decrypt(legacy).Should().Be("legacy certificate");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Constructor_rejects_missing_key(string? key)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Encryption:Key"] = key })
            .Build();

        var act = () => new TokenEncryptionService(configuration);

        act.Should().Throw<InvalidOperationException>();
    }

    private static TokenEncryptionService CreateService(string key)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Encryption:Key"] = key })
            .Build();
        return new TokenEncryptionService(configuration);
    }

    private static string EncryptLegacyCbc(string plainText, string key)
    {
        var derivedKey = SHA256.HashData(Encoding.UTF8.GetBytes(key));
        using var aes = Aes.Create();
        aes.Key = derivedKey;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;
        aes.GenerateIV();

        using var encryptor = aes.CreateEncryptor();
        var plainBytes = Encoding.UTF8.GetBytes(plainText);
        var cipherBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);
        return Convert.ToBase64String(aes.IV.Concat(cipherBytes).ToArray());
    }
}
