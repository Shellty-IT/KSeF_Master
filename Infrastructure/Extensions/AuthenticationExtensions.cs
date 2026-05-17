// Infrastructure/Extensions/AuthenticationExtensions.cs
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace KSeF.Backend.Infrastructure.Extensions;

public static class AuthenticationExtensions
{
    public static WebApplicationBuilder AddAppAuthentication(this WebApplicationBuilder builder)
    {
        var jwtKey = builder.Configuration.GetValue<string>("Jwt:Key");
        if (string.IsNullOrWhiteSpace(jwtKey))
            throw new InvalidOperationException(
                "JWT signing key (Jwt:Key) is not configured. " +
                "Set it via the JWT_KEY environment variable or appsettings.");

        var jwtIssuer = builder.Configuration.GetValue<string>("Jwt:Issuer") ?? "KSeFMaster";
        var jwtAudience = builder.Configuration.GetValue<string>("Jwt:Audience") ?? "KSeFMasterApp";

        builder.Services
            .AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtIssuer,
                    ValidAudience = jwtAudience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!)),
                    ClockSkew = TimeSpan.FromMinutes(2)
                };
            });

        builder.Services.AddAuthorization();

        return builder;
    }
}