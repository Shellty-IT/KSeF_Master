using System.Security.Cryptography;
using System.Text;
using KSeF.Backend.Services.Interfaces.Auth;

namespace KSeF.Backend.Services.Auth;

public class TokenEncryptionService : ITokenEncryptionService
{
    private const string AuthenticatedPrefix = "v2:";
    private const int NonceSize = 12;
    private const int TagSize = 16;
    private static readonly byte[] AssociatedData =
        Encoding.UTF8.GetBytes("KSeF.Master.Secret.v2");

    private readonly byte[] _key;

    public TokenEncryptionService(IConfiguration configuration)
    {
        var keyString = configuration.GetValue<string>("Encryption:Key");
        if (string.IsNullOrWhiteSpace(keyString))
            throw new InvalidOperationException("Encryption:Key is not configured");

        _key = SHA256.HashData(Encoding.UTF8.GetBytes(keyString));
    }

    public string Encrypt(string plainText)
    {
        ArgumentNullException.ThrowIfNull(plainText);

        var plainBytes = Encoding.UTF8.GetBytes(plainText);
        var nonce = RandomNumberGenerator.GetBytes(NonceSize);
        var cipherBytes = new byte[plainBytes.Length];
        var tag = new byte[TagSize];

        using var aes = new AesGcm(_key, TagSize);
        aes.Encrypt(nonce, plainBytes, cipherBytes, tag, AssociatedData);

        var payload = new byte[NonceSize + TagSize + cipherBytes.Length];
        Buffer.BlockCopy(nonce, 0, payload, 0, NonceSize);
        Buffer.BlockCopy(tag, 0, payload, NonceSize, TagSize);
        Buffer.BlockCopy(cipherBytes, 0, payload, NonceSize + TagSize, cipherBytes.Length);

        CryptographicOperations.ZeroMemory(plainBytes);
        return AuthenticatedPrefix + Convert.ToBase64String(payload);
    }

    public string Decrypt(string cipherText)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(cipherText);

        return cipherText.StartsWith(AuthenticatedPrefix, StringComparison.Ordinal)
            ? DecryptAuthenticated(cipherText[AuthenticatedPrefix.Length..])
            : DecryptLegacyCbc(cipherText);
    }

    private string DecryptAuthenticated(string encodedPayload)
    {
        var payload = Convert.FromBase64String(encodedPayload);
        if (payload.Length < NonceSize + TagSize)
            throw new CryptographicException("Encrypted value is malformed");

        var nonce = payload.AsSpan(0, NonceSize);
        var tag = payload.AsSpan(NonceSize, TagSize);
        var cipherBytes = payload.AsSpan(NonceSize + TagSize);
        var plainBytes = new byte[cipherBytes.Length];

        using var aes = new AesGcm(_key, TagSize);
        aes.Decrypt(nonce, cipherBytes, tag, plainBytes, AssociatedData);

        try
        {
            return Encoding.UTF8.GetString(plainBytes);
        }
        finally
        {
            CryptographicOperations.ZeroMemory(plainBytes);
        }
    }

    // Compatibility path for values written by releases that used AES-CBC.
    private string DecryptLegacyCbc(string cipherText)
    {
        var fullBytes = Convert.FromBase64String(cipherText);
        if (fullBytes.Length < 32 || (fullBytes.Length - 16) % 16 != 0)
            throw new CryptographicException("Encrypted value is malformed");

        using var aes = Aes.Create();
        aes.Key = _key;
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;
        aes.IV = fullBytes[..16];

        using var decryptor = aes.CreateDecryptor();
        var plainBytes = decryptor.TransformFinalBlock(fullBytes, 16, fullBytes.Length - 16);
        try
        {
            return Encoding.UTF8.GetString(plainBytes);
        }
        finally
        {
            CryptographicOperations.ZeroMemory(plainBytes);
        }
    }
}
