// Services/Auth/UserAuthService.cs
using KSeF.Backend.Models.Data;
using KSeF.Backend.Models.Requests;
using KSeF.Backend.Models.Responses;
using KSeF.Backend.Repositories;
using KSeF.Backend.Services.Interfaces.Auth;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace KSeF.Backend.Services.Auth;

public class UserAuthService : IUserAuthService
{
    private static readonly string DummyPasswordHash = BCrypt.Net.BCrypt.HashPassword(
        "timing-normalization-password-not-used-for-login");

    private readonly IUserRepository _userRepository;
    private readonly IJwtService _jwtService;
    private readonly ILogger<UserAuthService> _logger;

    public UserAuthService(
        IUserRepository userRepository,
        IJwtService jwtService,
        ILogger<UserAuthService> logger)
    {
        _userRepository = userRepository;
        _jwtService = jwtService;
        _logger = logger;
    }

    public async Task<AppAuthResult> RegisterAsync(RegisterRequest request)
    {
        var errors = ValidateRegister(request);
        if (errors.Count > 0)
            return Fail(string.Join("; ", errors));

        var emailLower = request.Email.Trim().ToLowerInvariant();

        if (await _userRepository.EmailExistsAsync(emailLower))
            return Fail("Konto z tym adresem email już istnieje");

        var user = new User
        {
            Email = emailLower,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Name = request.Name.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        try
        {
            await _userRepository.CreateAsync(user);
        }
        catch (DbUpdateException ex) when (
            ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            return Fail("Konto z tym adresem email już istnieje");
        }

        _logger.LogInformation("User registered: {UserId}", user.Id);

        return new AppAuthResult
        {
            Success = true,
            Token = _jwtService.GenerateToken(user),
            User = MapUserInfo(user)
        };
    }

    public async Task<AppAuthResult> LoginAsync(LoginAppRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return Fail("Email i hasło są wymagane");

        if (request.Email.Length > 256 || request.Password.Length > 128)
            return Fail("Nieprawidłowy email lub hasło");

        var user = await _userRepository.GetByEmailAsync(request.Email);
        var passwordHash = user?.PasswordHash ?? DummyPasswordHash;
        var passwordMatches = BCrypt.Net.BCrypt.Verify(request.Password, passwordHash);

        if (user == null || !passwordMatches)
            return Fail("Nieprawidłowy email lub hasło");

        _logger.LogInformation("User logged in: {UserId}", user.Id);

        return new AppAuthResult
        {
            Success = true,
            Token = _jwtService.GenerateToken(user),
            User = MapUserInfo(user)
        };
    }

    public async Task<UserInfo?> GetUserByIdAsync(int userId)
    {
        var user = await _userRepository.GetByIdWithCompanyAsync(userId);
        return user == null ? null : MapUserInfo(user);
    }

    private static List<string> ValidateRegister(RegisterRequest request)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(request.Email))
            errors.Add("Email jest wymagany");
        else if (!request.Email.Contains('@') || !request.Email.Contains('.'))
            errors.Add("Nieprawidłowy format email");

        if (string.IsNullOrWhiteSpace(request.Password))
            errors.Add("Hasło jest wymagane");
        else if (request.Password.Length < 8)
            errors.Add("Hasło musi mieć co najmniej 8 znaków");
        else if (request.Password.Length > 128)
            errors.Add("Hasło może mieć maksymalnie 128 znaków");

        if (string.IsNullOrWhiteSpace(request.Name))
            errors.Add("Imię i nazwisko jest wymagane");

        return errors;
    }

    private static AppAuthResult Fail(string error) =>
        new() { Success = false, Error = error };

    internal static UserInfo MapUserInfo(User user)
    {
        return new UserInfo
        {
            Id = user.Id,
            Email = user.Email,
            Name = user.Name,
            Company = user.CompanyProfile != null
                ? new CompanyInfo
                {
                    Id = user.CompanyProfile.Id,
                    CompanyName = user.CompanyProfile.CompanyName,
                    Nip = user.CompanyProfile.Nip,
                    IsActive = user.CompanyProfile.IsActive,
                    HasKsefToken = !string.IsNullOrEmpty(user.CompanyProfile.KsefTokenEncrypted),
                    AuthMethod = user.CompanyProfile.AuthMethod,
                    KsefEnvironment = user.CompanyProfile.KsefEnvironment,
                    HasCertificate = !string.IsNullOrEmpty(user.CompanyProfile.CertificateEncrypted)
                }
                : null
        };
    }
}
