namespace KSeF.Backend.Models.Enums;

public static class KSeFEnvironmentType
{
    public const string Test = "Test";
    public const string Production = "Production";

    public static bool IsValid(string? value) =>
        value is Test or Production;
}
