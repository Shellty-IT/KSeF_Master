using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using KSeF.Backend.Models.Common;
using KSeF.Backend.Models.Requests;
using KSeF.Backend.Repositories;
using KSeF.Backend.Services.Interfaces.KSeF;
using KSeF.Backend.Services.Interfaces.Pdf;

namespace KSeF.Backend.Controllers;

[Route("api/ksef")]
[Produces("application/json")]
[Authorize]
public class KSeFInvoiceController : BaseApiController
{
    private readonly IKSeFInvoiceService _invoiceService;
    private readonly IKSeFInvoiceQueryService _queryService;
    private readonly ICompanyRepository _companyRepository;
    private readonly ILogger<KSeFInvoiceController> _logger;

    public KSeFInvoiceController(
        IKSeFInvoiceService invoiceService,
        IKSeFInvoiceQueryService queryService,
        ICompanyRepository companyRepository,
        ILogger<KSeFInvoiceController> logger)
    {
        _invoiceService = invoiceService;
        _queryService = queryService;
        _companyRepository = companyRepository;
        _logger = logger;
    }

    [HttpGet("invoices/cached")]
    public async Task<IActionResult> GetCachedInvoices(CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(ApiResponse<object?>.Fail("Brak autoryzacji"));

        var company = await _companyRepository.GetByUserIdAsync(userId.Value);
        if (company == null)
            return BadRequest(ApiResponse<object?>.Fail("Brak skonfigurowanej firmy"));

        var cached = await _queryService.GetCachedInvoicesAsync(company.Id);
        _logger.LogInformation("GetCachedInvoices: zwrócono {Count} faktur z bazy", cached.Count);

        return Ok(ApiResponse<object>.Ok(new
        {
            invoices = cached,
            totalCount = cached.Count,
            fetchedAt = DateTime.UtcNow
        }));
    }

    [HttpPost("invoices/sync")]
    public async Task<IActionResult> SyncInvoices(CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(ApiResponse<object?>.Fail("Brak autoryzacji"));

        var company = await _companyRepository.GetByUserIdAsync(userId.Value);
        if (company == null)
            return BadRequest(ApiResponse<object?>.Fail("Brak skonfigurowanej firmy"));

        _logger.LogInformation("SyncInvoices: companyProfileId={Id}, NIP={Nip}", company.Id, company.Nip);

        var issued = await _invoiceService.SyncInvoicesAsync(
            company.Id, company.Nip, company.KsefEnvironment, "issued", ct);
        var received = await _invoiceService.SyncInvoicesAsync(
            company.Id, company.Nip, company.KsefEnvironment, "received", ct);

        return Ok(ApiResponse<object>.Ok(new
        {
            issued = new { newCount = issued.NewCount, totalFetched = issued.TotalFetched },
            received = new { newCount = received.NewCount, totalFetched = received.TotalFetched },
            syncedAt = DateTime.UtcNow
        }));
    }

    [HttpPost("invoices")]
    public async Task<IActionResult> GetInvoices(
        [FromBody] InvoiceQueryRequest request,
        [FromServices] IValidator<InvoiceQueryRequest> validator,
        CancellationToken ct)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            return BadRequest(new
            {
                success = false,
                error = "Błędy walidacji zapytania",
                details = validationResult.Errors.Select(e => e.ErrorMessage)
            });

        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(ApiResponse<object?>.Fail("Brak autoryzacji"));

        var company = await _companyRepository.GetByUserIdAsync(userId.Value);
        if (company == null)
            return BadRequest(ApiResponse<object?>.Fail("Brak skonfigurowanej firmy"));

        _logger.LogInformation("GetInvoices (cache only): companyProfileId={Id}", company.Id);

        var cached = await _queryService.GetCachedInvoicesAsync(company.Id, request);

        return Ok(ApiResponse<object>.Ok(new
        {
            invoices = cached,
            totalCount = cached.Count,
            fetchedAt = DateTime.UtcNow
        }));
    }

    [HttpGet("invoices/stats")]
    public async Task<IActionResult> GetInvoiceStats(
        [FromQuery] int months = 3,
        CancellationToken ct = default)
    {
        if (months < 1) months = 1;
        if (months > 12) months = 12;

        _logger.LogInformation("GetInvoiceStats: months={Months}", months);

        var stats = await _invoiceService.GetInvoiceStatsAsync(months, ct);
        return Ok(ApiResponse<object>.Ok(stats));
    }

    [HttpPost("invoice/send")]
    public async Task<IActionResult> SendInvoice(
        [FromBody] CreateInvoiceRequest request,
        [FromServices] IValidator<CreateInvoiceRequest> validator,
        CancellationToken ct)
    {
        var validationResult = await validator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
            return BadRequest(new
            {
                success = false,
                error = "Błędy walidacji",
                details = validationResult.Errors.Select(e => e.ErrorMessage)
            });

        _logger.LogInformation("SendInvoice: {Number}", request.InvoiceNumber);

        var result = await _invoiceService.SendInvoiceAsync(request, ct);

        if (!result.Success)
            return BadRequest(ApiResponse<object?>.Fail(result.Error ?? "Wysyłka faktury nie powiodła się"));

        return Ok(ApiResponse<object>.Ok(new
        {
            elementReferenceNumber = result.ElementReferenceNumber,
            processingCode = result.ProcessingCode,
            processingDescription = result.ProcessingDescription,
            invoiceHash = result.InvoiceHash
        }, "Faktura wysłana pomyślnie do KSeF"));
    }

    [HttpPost("invoice/pdf")]
    public IActionResult GeneratePdf(
        [FromBody] GeneratePdfRequest request,
        [FromServices] IPdfGeneratorService pdfService)
    {
        _logger.LogInformation("GeneratePdf: {Number}", request.InvoiceNumber);

        if (string.IsNullOrEmpty(request.InvoiceHash))
            return BadRequest(ApiResponse<object?>.Fail("Hash faktury jest wymagany"));

        var pdfBytes = pdfService.GeneratePdf(request);
        var fileName = SanitizeFileName(request.InvoiceNumber ?? "faktura") + ".pdf";
        return File(pdfBytes, "application/pdf", fileName);
    }

    [HttpGet("invoice/{ksefNumber}")]
    public async Task<IActionResult> GetInvoiceDetails(string ksefNumber, CancellationToken ct)
    {
        _logger.LogInformation("GetInvoiceDetails: {KsefNumber}", ksefNumber);

        if (string.IsNullOrWhiteSpace(ksefNumber))
            return BadRequest(ApiResponse<object?>.Fail("Numer KSeF jest wymagany"));

        var result = await _invoiceService.GetInvoiceDetailsAsync(ksefNumber, ct);

        if (!result.Success)
            return BadRequest(ApiResponse<object?>.Fail(result.Error ?? "Pobieranie szczegółów faktury nie powiodło się"));

        return Ok(ApiResponse<object>.Ok(result));
    }

    private static string SanitizeFileName(string name)
    {
        var invalid = Path.GetInvalidFileNameChars();
        return string.Join("-", name.Split(invalid, StringSplitOptions.RemoveEmptyEntries));
    }
}
