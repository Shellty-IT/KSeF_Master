namespace KSeF.Backend.Models.Constants;

public static class JwtConstants
{
    public const int DefaultExpirationHours = 24;
    public const int ClockSkewMinutes = 2;
    public const string DefaultIssuer = "KSeFMaster";
    public const string DefaultAudience = "KSeFMasterApp";
    public const int MinKeyLengthChars = 32;
}
