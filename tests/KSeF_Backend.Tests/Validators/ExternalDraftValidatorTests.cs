using FluentAssertions;
using KSeF.Backend.Models.Requests;
using KSeF.Backend.Services.External;
using Xunit;

namespace KSeF_Backend.Tests.Validators;

public class ExternalDraftValidatorTests
{
    private readonly ExternalDraftValidator _sut = new();

    [Fact]
    public void Valid_request_passes()
    {
        _sut.Validate(Valid()).Should().BeEmpty();
    }

    [Fact]
    public void Inconsistent_item_totals_fail()
    {
        var request = Valid();
        request.Items[0].TotalGross = 999m;

        var errors = _sut.Validate(request);

        errors.Should().Contain(error => error.StartsWith("Pozycja 1: totalGross"));
    }

    [Fact]
    public void Inconsistent_document_totals_fail()
    {
        var request = Valid();
        request.TotalNet = 1m;

        _sut.Validate(request).Should().Contain(error => error.StartsWith("totalNet"));
    }

    [Theory]
    [InlineData("13.07.2026")]
    [InlineData("2026/07/13")]
    [InlineData("not-a-date")]
    public void Non_iso_date_fails(string issueDate)
    {
        var request = Valid();
        request.IssueDate = issueDate;

        _sut.Validate(request).Should().Contain("issueDate jest wymagany w formacie YYYY-MM-DD");
    }

    [Fact]
    public void Null_party_is_reported_instead_of_throwing()
    {
        var request = Valid();
        request.Seller = null!;

        var act = () => _sut.Validate(request);

        act.Should().NotThrow();
        act().Should().Contain("seller jest wymagany");
    }

    private static SmartQuoteImportRequest Valid() => new()
    {
        SmartQuoteId = "quote-1",
        OfferNumber = "OFF/1",
        IssueDate = "2026-07-13",
        DueDate = "2026-07-27",
        Seller = Party("5260001228", "Sprzedawca"),
        Buyer = Party("5250001009", "Nabywca"),
        Items =
        [
            new SmartQuoteItem
            {
                Name = "Usługa",
                Quantity = 2m,
                Unit = "szt.",
                UnitPrice = 50m,
                VatRate = 23,
                Discount = 10m,
                TotalNet = 90m,
                TotalVat = 20.70m,
                TotalGross = 110.70m
            }
        ],
        TotalNet = 90m,
        TotalVat = 20.70m,
        TotalGross = 110.70m,
        Currency = "PLN",
        PaymentDays = 14
    };

    private static SmartQuoteParty Party(string nip, string name) => new()
    {
        Nip = nip,
        Name = name,
        Address = "ul. Testowa 1",
        City = "Warszawa",
        PostalCode = "00-001"
    };
}
