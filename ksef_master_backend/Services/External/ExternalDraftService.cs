// Services/External/ExternalDraftService.cs
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using KSeF.Backend.Models;
using KSeF.Backend.Models.Data;
using KSeF.Backend.Models.Requests;
using KSeF.Backend.Services.Interfaces.External;

namespace KSeF.Backend.Services.External;

public class DuplicateSmartQuoteIdException : Exception
{
    public string ExistingDraftId { get; }
    public DuplicateSmartQuoteIdException(string existingDraftId)
        : base("A draft with this SmartQuote ID already exists") => ExistingDraftId = existingDraftId;
}

public class ExternalDraftService : IExternalDraftService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ExternalDraftService> _logger;

    public ExternalDraftService(
        AppDbContext db,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory,
        ILogger<ExternalDraftService> logger)
    {
        _db = db;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<ExternalDraft?> GetByIdAsync(string id, string? sellerNip = null)
    {
        var query = _db.ExternalDrafts.AsQueryable();
        if (!string.IsNullOrWhiteSpace(sellerNip))
            query = query.Where(d => d.SellerNip == sellerNip);
        return await query.FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<ExternalDraft?> GetBySmartQuoteIdAsync(string smartQuoteId)
    {
        return await _db.ExternalDrafts.FirstOrDefaultAsync(d => d.SmartQuoteId == smartQuoteId);
    }

    public async Task<List<ExternalDraft>> GetAllAsync(string? statusFilter = null, string? sellerNip = null)
    {
        var query = _db.ExternalDrafts.AsQueryable();

        if (!string.IsNullOrEmpty(statusFilter) &&
            Enum.TryParse<ExternalDraftStatus>(statusFilter, true, out var status))
        {
            query = query.Where(d => d.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(sellerNip))
            query = query.Where(d => d.SellerNip == sellerNip);

        return await query.OrderByDescending(d => d.CreatedAt).ToListAsync();
    }

    public async Task<bool> ExistsBySmartQuoteIdAsync(string smartQuoteId)
    {
        return await _db.ExternalDrafts.AnyAsync(d => d.SmartQuoteId == smartQuoteId);
    }

    public async Task<ExternalDraft> ImportAsync(SmartQuoteImportRequest request)
    {
        var draft = new ExternalDraft
        {
            SmartQuoteId = request.SmartQuoteId,
            OfferNumber = request.OfferNumber,
            IssueDate = request.IssueDate,
            DueDate = request.DueDate,
            SellerName = request.Seller.Name,
            SellerNip = request.Seller.Nip,
            SellerAddress = request.Seller.Address,
            SellerCity = request.Seller.City,
            SellerPostalCode = request.Seller.PostalCode,
            BuyerName = request.Buyer.Name,
            BuyerNip = request.Buyer.Nip,
            BuyerAddress = request.Buyer.Address,
            BuyerCity = request.Buyer.City,
            BuyerPostalCode = request.Buyer.PostalCode,
            Items = request.Items.Select(i => new ExternalDraftItem
            {
                Name = i.Name,
                Description = i.Description,
                Quantity = i.Quantity,
                Unit = i.Unit,
                UnitPrice = i.UnitPrice,
                VatRate = i.VatRate,
                Discount = i.Discount,
                TotalNet = i.TotalNet,
                TotalVat = i.TotalVat,
                TotalGross = i.TotalGross
            }).ToList(),
            TotalNet = request.TotalNet,
            TotalVat = request.TotalVat,
            TotalGross = request.TotalGross,
            Currency = request.Currency.ToUpperInvariant(),
            PaymentDays = request.PaymentDays
        };

        _db.ExternalDrafts.Add(draft);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            // Race condition: two simultaneous requests for the same smartQuoteId.
            // The unique index caught the duplicate — return the existing draft id.
            _db.ChangeTracker.Clear();
            var existing = await _db.ExternalDrafts
                .Where(d => d.SmartQuoteId == request.SmartQuoteId)
                .Select(d => d.Id)
                .FirstOrDefaultAsync();

            throw new DuplicateSmartQuoteIdException(existing ?? "unknown");
        }

        _logger.LogInformation(
            "Imported SmartQuote draft: {SmartQuoteId} -> {DraftId}",
            request.SmartQuoteId, draft.Id);

        return draft;
    }

    // Fix #2: atomic conditional UPDATE prevents double-approve race condition.
    // ExecuteSqlAsync uses FormattableString parameters — no SQL injection risk.
    public async Task<ExternalDraft?> ApproveAsync(string id, string processedBy, string? sellerNip = null)
    {
        var now = DateTime.UtcNow;
        int affected;

        if (!string.IsNullOrWhiteSpace(sellerNip))
        {
            affected = await _db.Database.ExecuteSqlAsync(
                $@"UPDATE ""ExternalDrafts""
                   SET ""Status"" = 'APPROVED', ""ProcessedAt"" = {now}, ""ProcessedBy"" = {processedBy}
                   WHERE ""Id"" = {id} AND ""Status"" = 'PENDING' AND ""SellerNip"" = {sellerNip}");
        }
        else
        {
            affected = await _db.Database.ExecuteSqlAsync(
                $@"UPDATE ""ExternalDrafts""
                   SET ""Status"" = 'APPROVED', ""ProcessedAt"" = {now}, ""ProcessedBy"" = {processedBy}
                   WHERE ""Id"" = {id} AND ""Status"" = 'PENDING'");
        }

        if (affected == 0) return null;

        var draft = await _db.ExternalDrafts.AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == id);

        if (draft == null) return null;

        _logger.LogInformation(
            "Approved draft: {DraftId} (SmartQuoteId: {SmartQuoteId})",
            id, draft.SmartQuoteId);

        _ = SendWebhookWithRetryAsync(draft.SmartQuoteId, "approved", draft.Id, "Faktura zatwierdzona");

        return draft;
    }

    // Same atomic fix for Reject
    public async Task<ExternalDraft?> RejectAsync(string id, string processedBy, string reason, string? sellerNip = null)
    {
        var now = DateTime.UtcNow;
        int affected;

        if (!string.IsNullOrWhiteSpace(sellerNip))
        {
            affected = await _db.Database.ExecuteSqlAsync(
                $@"UPDATE ""ExternalDrafts""
                   SET ""Status"" = 'REJECTED', ""ProcessedAt"" = {now}, ""ProcessedBy"" = {processedBy}, ""RejectionReason"" = {reason}
                   WHERE ""Id"" = {id} AND ""Status"" = 'PENDING' AND ""SellerNip"" = {sellerNip}");
        }
        else
        {
            affected = await _db.Database.ExecuteSqlAsync(
                $@"UPDATE ""ExternalDrafts""
                   SET ""Status"" = 'REJECTED', ""ProcessedAt"" = {now}, ""ProcessedBy"" = {processedBy}, ""RejectionReason"" = {reason}
                   WHERE ""Id"" = {id} AND ""Status"" = 'PENDING'");
        }

        if (affected == 0) return null;

        var draft = await _db.ExternalDrafts.AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == id);

        if (draft == null) return null;

        _logger.LogInformation(
            "Rejected draft: {DraftId} (SmartQuoteId: {SmartQuoteId}), reason: {Reason}",
            id, draft.SmartQuoteId, reason);

        _ = SendWebhookWithRetryAsync(draft.SmartQuoteId, "rejected", null, reason);

        return draft;
    }

    // Fix #3: retry with exponential backoff (1s, 2s, 4s). Fire-and-forget caller ignores the Task.
    private async Task SendWebhookWithRetryAsync(string smartQuoteId, string action, string? externalId, string message)
    {
        const int maxAttempts = 4;
        for (var attempt = 0; attempt < maxAttempts; attempt++)
        {
            try
            {
                await SendWebhookAsync(smartQuoteId, action, externalId, message);
                return;
            }
            catch (Exception ex) when (attempt < maxAttempts - 1)
            {
                var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt)); // 1s, 2s, 4s
                _logger.LogWarning(
                    ex,
                    "Webhook attempt {Attempt}/{Max} failed for {SmartQuoteId}, retrying in {Delay}s",
                    attempt + 1, maxAttempts, smartQuoteId, delay.TotalSeconds);
                await Task.Delay(delay);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "All {Max} webhook attempts failed for {SmartQuoteId}",
                    maxAttempts, smartQuoteId);
            }
        }
    }

    // Fix #4: HMAC-SHA256 signing (timestamp + smartQuoteId + action).
    // SmartQuote verifies the same on receive. Prevents spoofed callbacks and replay attacks.
    private async Task SendWebhookAsync(
        string smartQuoteId,
        string action,
        string? externalId,
        string message)
    {
        var webhookUrl = _configuration.GetValue<string>("SmartQuote:WebhookUrl");
        var apiKey = _configuration.GetValue<string>("SmartQuote:ApiKey");

        if (string.IsNullOrEmpty(webhookUrl) || string.IsNullOrEmpty(apiKey))
        {
            _logger.LogWarning("SmartQuote webhook not configured, skipping callback");
            return;
        }

        var payload = new { smartQuoteId, action, externalId, message };
        var jsonBody = JsonSerializer.Serialize(payload);
        var fullUrl = $"{webhookUrl.TrimEnd('/')}/api/ksef/webhook";

        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var signature = ComputeHmacSha256(apiKey, $"{timestamp}.{smartQuoteId}.{action}");

        _logger.LogInformation(
            "Sending webhook to {Url}: {Action} for {SmartQuoteId}",
            fullUrl, action, smartQuoteId);

        var client = _httpClientFactory.CreateClient("SmartQuoteWebhook");
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, fullUrl);
        httpRequest.Headers.Add("X-API-Key", apiKey);
        httpRequest.Headers.Add("X-Timestamp", timestamp);
        httpRequest.Headers.Add("X-Signature", signature);
        httpRequest.Content = new StringContent(jsonBody, Encoding.UTF8, "application/json");

        var response = await client.SendAsync(httpRequest);

        if (response.IsSuccessStatusCode)
        {
            _logger.LogInformation("Webhook delivered for {SmartQuoteId}", smartQuoteId);
        }
        else
        {
            var body = await response.Content.ReadAsStringAsync();
            _logger.LogWarning(
                "Webhook returned {StatusCode} for {SmartQuoteId}: {Body}",
                response.StatusCode, smartQuoteId, body);
            // Throw so the retry wrapper can attempt again
            throw new HttpRequestException($"Webhook non-success: {response.StatusCode}");
        }
    }

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is PostgresException { SqlState: "23505" };

    private static string ComputeHmacSha256(string key, string data)
    {
        var keyBytes = Encoding.UTF8.GetBytes(key);
        var dataBytes = Encoding.UTF8.GetBytes(data);
        using var hmac = new HMACSHA256(keyBytes);
        return Convert.ToHexString(hmac.ComputeHash(dataBytes)).ToLowerInvariant();
    }
}
