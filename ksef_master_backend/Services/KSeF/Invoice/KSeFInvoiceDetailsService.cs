using System.Globalization;
using System.Xml;
using KSeF.Backend.Infrastructure.KSeF;
using KSeF.Backend.Models.Responses.Common;
using KSeF.Backend.Services.Interfaces.KSeF;
using KSeF.Backend.Services.KSeF.Session;

namespace KSeF.Backend.Services.KSeF.Invoice;

public class KSeFInvoiceDetailsService : IKSeFInvoiceDetailsService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IKSeFEnvironmentService _environmentService;
    private readonly KSeFSessionManager _sessionManager;
    private readonly ILogger<KSeFInvoiceDetailsService> _logger;

    public KSeFInvoiceDetailsService(
        IHttpClientFactory httpClientFactory,
        IKSeFEnvironmentService environmentService,
        KSeFSessionManager sessionManager,
        ILogger<KSeFInvoiceDetailsService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _environmentService = environmentService;
        _sessionManager = sessionManager;
        _logger = logger;
    }

    public async Task<InvoiceDetailsResult> GetInvoiceDetailsAsync(
        string ksefNumber,
        CancellationToken cancellationToken = default)
    {
        if (!_sessionManager.IsAuthenticated)
            throw new UnauthorizedAccessException("Brak aktywnej sesji KSeF");

        var client = CreateAuthenticatedClient();

        try
        {
            _logger.LogInformation("Fetching invoice details: {KsefNumber}", ksefNumber);

            var encodedKsefNumber = Uri.EscapeDataString(ksefNumber);
            using var response = await client.GetAsync(
                $"invoices/ksef/{encodedKsefNumber}",
                cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var error = KSeFErrorParser.Parse(responseBody);
                return Fail($"Błąd pobierania faktury: {error}");
            }

            if (string.IsNullOrWhiteSpace(responseBody))
                return Fail("Brak danych faktury w odpowiedzi");

            var parsed = ParseInvoiceXml(responseBody);
            var invoiceHash = response.Headers.TryGetValues("x-ms-meta-hash", out var hashValues)
                ? hashValues.FirstOrDefault()
                : null;

            return new InvoiceDetailsResult
            {
                Success = true,
                InvoiceHash = invoiceHash,
                InvoiceXml = responseBody,
                KsefNumber = ksefNumber,
                InvoiceNumber = parsed.InvoiceNumber,
                IssueDate = parsed.IssueDate,
                SellerNip = parsed.SellerNip,
                SellerName = parsed.SellerName,
                SellerAddress = parsed.SellerAddress,
                BuyerNip = parsed.BuyerNip,
                BuyerName = parsed.BuyerName,
                BuyerAddress = parsed.BuyerAddress,
                NetTotal = parsed.NetTotal,
                VatTotal = parsed.VatTotal,
                GrossTotal = parsed.GrossTotal,
                Items = parsed.Items
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching invoice details: {KsefNumber}", ksefNumber);
            return Fail("Nie udało się odczytać faktury zwróconej przez KSeF");
        }
    }

    private HttpClient CreateAuthenticatedClient()
    {
        var client = _httpClientFactory.CreateClient("KSeF");
        var environment = _sessionManager.Environment
            ?? throw new InvalidOperationException("Brak środowiska dla aktywnej sesji KSeF");
        client.BaseAddress = new Uri(_environmentService.GetApiBaseUrl(environment));
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _sessionManager.AccessToken);
        return client;
    }

    private static InvoiceDetailsResult Fail(string error) =>
        new() { Success = false, Error = error };

    private static ParsedInvoice ParseInvoiceXml(string xml)
    {
        var doc = new XmlDocument { XmlResolver = null };
        doc.LoadXml(xml);

        var nsmgr = new XmlNamespaceManager(doc.NameTable);
        var invoiceNamespace = doc.DocumentElement?.NamespaceURI;
        if (string.IsNullOrWhiteSpace(invoiceNamespace))
            throw new XmlException("Dokument faktury nie zawiera przestrzeni nazw");
        nsmgr.AddNamespace("f", invoiceNamespace);

        var items = doc.SelectNodes("//f:FaWiersz", nsmgr)?
            .Cast<XmlNode>()
            .Select(node => ParseItem(node, nsmgr))
            .ToList() ?? [];

        return new ParsedInvoice
        {
            InvoiceNumber = doc.SelectSingleNode("//f:P_2", nsmgr)?.InnerText,
            IssueDate = doc.SelectSingleNode("//f:P_1", nsmgr)?.InnerText,
            SellerNip = doc.SelectSingleNode("//f:Podmiot1/f:DaneIdentyfikacyjne/f:NIP", nsmgr)?.InnerText,
            SellerName = doc.SelectSingleNode("//f:Podmiot1/f:DaneIdentyfikacyjne/f:Nazwa", nsmgr)?.InnerText,
            SellerAddress = ReadAddress(doc.SelectSingleNode("//f:Podmiot1/f:Adres", nsmgr), nsmgr),
            BuyerNip = doc.SelectSingleNode("//f:Podmiot2/f:DaneIdentyfikacyjne/f:NIP", nsmgr)?.InnerText,
            BuyerName = doc.SelectSingleNode("//f:Podmiot2/f:DaneIdentyfikacyjne/f:Nazwa", nsmgr)?.InnerText,
            BuyerAddress = ReadAddress(doc.SelectSingleNode("//f:Podmiot2/f:Adres", nsmgr), nsmgr),
            NetTotal = SumNodes(doc, "//f:Fa/*[starts-with(local-name(), 'P_13_')]", nsmgr),
            VatTotal = SumNodes(doc, "//f:Fa/*[starts-with(local-name(), 'P_14_')]", nsmgr),
            GrossTotal = ParseDecimal(doc.SelectSingleNode("//f:Fa/f:P_15", nsmgr)?.InnerText),
            Items = items
        };
    }

    private static InvoiceItemResult ParseItem(XmlNode node, XmlNamespaceManager nsmgr)
    {
        var net = ParseDecimal(node.SelectSingleNode("f:P_11", nsmgr)?.InnerText);
        var vatRate = node.SelectSingleNode("f:P_12", nsmgr)?.InnerText ?? "23";
        var rate = decimal.TryParse(
            vatRate,
            NumberStyles.Number,
            CultureInfo.InvariantCulture,
            out var parsedRate)
            ? parsedRate / 100m
            : 0m;
        var vat = Math.Round(net * rate, 2, MidpointRounding.AwayFromZero);

        return new InvoiceItemResult
        {
            Name = node.SelectSingleNode("f:P_7", nsmgr)?.InnerText ?? string.Empty,
            Unit = node.SelectSingleNode("f:P_8A", nsmgr)?.InnerText ?? "szt.",
            Quantity = ParseDecimal(node.SelectSingleNode("f:P_8B", nsmgr)?.InnerText),
            UnitPriceNet = ParseDecimal(node.SelectSingleNode("f:P_9A", nsmgr)?.InnerText),
            VatRate = vatRate,
            NetValue = net,
            VatValue = vat,
            GrossValue = net + vat
        };
    }

    private static string? ReadAddress(XmlNode? addressNode, XmlNamespaceManager nsmgr)
    {
        if (addressNode is null) return null;

        var lines = new[]
        {
            addressNode.SelectSingleNode("f:AdresL1", nsmgr)?.InnerText,
            addressNode.SelectSingleNode("f:AdresL2", nsmgr)?.InnerText
        };
        var address = string.Join(", ", lines.Where(line => !string.IsNullOrWhiteSpace(line)));
        return string.IsNullOrWhiteSpace(address) ? null : address;
    }

    private static decimal SumNodes(
        XmlDocument doc,
        string xpath,
        XmlNamespaceManager nsmgr) =>
        doc.SelectNodes(xpath, nsmgr)?
            .Cast<XmlNode>()
            .Sum(node => ParseDecimal(node.InnerText)) ?? 0m;

    private static decimal ParseDecimal(string? value) =>
        decimal.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture, out var parsed)
            ? parsed
            : 0m;

    private sealed class ParsedInvoice
    {
        public string? InvoiceNumber { get; init; }
        public string? IssueDate { get; init; }
        public string? SellerNip { get; init; }
        public string? SellerName { get; init; }
        public string? SellerAddress { get; init; }
        public string? BuyerNip { get; init; }
        public string? BuyerName { get; init; }
        public string? BuyerAddress { get; init; }
        public decimal NetTotal { get; init; }
        public decimal VatTotal { get; init; }
        public decimal GrossTotal { get; init; }
        public List<InvoiceItemResult> Items { get; init; } = [];
    }
}
