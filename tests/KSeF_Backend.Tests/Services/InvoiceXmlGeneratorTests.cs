using System.Xml.Linq;
using FluentAssertions;
using KSeF.Backend.Models.Requests;
using KSeF.Backend.Services.Invoice;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace KSeF_Backend.Tests.Services;

public class InvoiceXmlGeneratorTests
{
    private readonly InvoiceXmlGenerator _sut =
        new(NullLogger<InvoiceXmlGenerator>.Instance);

    [Fact]
    public void Generate_includes_discount_and_uses_discounted_totals()
    {
        var request = ValidInvoice([
            new InvoiceItem
            {
                Name = "Usługa",
                Unit = "szt.",
                Quantity = 2m,
                UnitPriceNet = 50m,
                DiscountPercent = 20m,
                VatRate = "23"
            }
        ]);

        var document = XDocument.Parse(_sut.Generate(request));

        Value(document, "P_10").Should().Be("20.00");
        Value(document, "P_11").Should().Be("80.00");
        Value(document, "P_13_1").Should().Be("80.00");
        Value(document, "P_14_1").Should().Be("18.40");
        Value(document, "P_15").Should().Be("98.40");
    }

    [Fact]
    public void Generate_sums_vat_rounded_for_each_line_like_the_frontend()
    {
        var items = Enumerable.Range(1, 3)
            .Select(index => new InvoiceItem
            {
                Name = $"Pozycja {index}",
                Unit = "szt.",
                Quantity = 1m,
                UnitPriceNet = 0.03m,
                VatRate = "23"
            })
            .ToList();

        var document = XDocument.Parse(_sut.Generate(ValidInvoice(items)));

        Value(document, "P_13_1").Should().Be("0.09");
        Value(document, "P_14_1").Should().Be("0.03");
        Value(document, "P_15").Should().Be("0.12");
    }

    private static string? Value(XDocument document, string localName) =>
        document.Descendants().FirstOrDefault(element => element.Name.LocalName == localName)?.Value;

    private static CreateInvoiceRequest ValidInvoice(List<InvoiceItem> items) => new()
    {
        InvoiceNumber = "FV/2026/1",
        IssueDate = "2026-07-13",
        SaleDate = "2026-07-13",
        Seller = new PartyData
        {
            Nip = "5260001228",
            Name = "Sprzedawca",
            AddressLine1 = "ul. Testowa 1"
        },
        Buyer = new PartyData
        {
            Nip = "5250001009",
            Name = "Nabywca",
            AddressLine1 = "ul. Przykładowa 2"
        },
        Items = items
    };
}
