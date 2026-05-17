namespace KSeF.Backend.Models.Constants;

public static class KSeFConstants
{
    public static class Sync
    {
        public const int DeltaOverlapSeconds = 30;
        public const int DefaultLookbackMonths = 3;
        public const int WindowSizeMonths = 1;
    }

    public static class Pagination
    {
        public const int DefaultMaxResults = 9900;
        public const int PageSize = 100;
        public const int MaxPageOffset = 9900;
        public const int MaxIterations = 200;
    }

    public static class DateType
    {
        public const string PermanentStorage = "PermanentStorage";
        public const string Issue = "Issue";
        public const string Invoicing = "Invoicing";
    }

    public static class SubjectType
    {
        public const string Subject1 = "subject1";
        public const string Subject2 = "subject2";
    }

    public static class Direction
    {
        public const string Issued = "issued";
        public const string Received = "received";
    }

    public static class Crypto
    {
        public const string PayloadSeparator = "|";
    }

    public static class Logging
    {
        public const int MaxErrorMessageLength = 300;
        public const int MaxResponseBodyLogLength = 2000;
        public const int MaxRequestBodyLogLength = 1000;
        public const int SanitizeMaxLength = 600;
    }

    public static class Defaults
    {
        public const string InvoiceType = "FA";
        public const int StatsDefaultMonths = 12;
    }
}
