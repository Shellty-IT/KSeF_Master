using FluentAssertions;
using FluentValidation;
using KSeF.Backend.Models.Requests;
using KSeF.Backend.Validators;
using Xunit;

namespace KSeF_Backend.Tests.Validators;

public class CreateInvoiceRequestValidatorTests
{
    private readonly IValidator<CreateInvoiceRequest> _sut = new CreateInvoiceRequestValidator();

    private static PartyData ValidParty(string prefix) => new()
    {
        Nip = "5260001228",
        Name = $"{prefix} Sp. z o.o.",
        AddressLine1 = "ul. Przykładowa 1, 00-001 Warszawa"
    };

    private static InvoiceItem ValidItem() => new()
    {
        Name = "Usługa konsultingowa",
        Quantity = 1,
        UnitPriceNet = 1000m
    };

    private static CreateInvoiceRequest Valid() => new()
    {
        InvoiceNumber = "FV/2025/001",
        IssueDate = "2025-01-15",
        SaleDate = "2025-01-15",
        Seller = ValidParty("Sprzedawca"),
        Buyer = ValidParty("Nabywca"),
        Items = [ValidItem()]
    };

    [Fact]
    public void Valid_request_passes()
    {
        _sut.Validate(Valid()).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Missing_invoice_number_fails()
    {
        var req = Valid();
        req.InvoiceNumber = "";
        var result = _sut.Validate(req);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "Numer faktury jest wymagany");
    }

    [Fact]
    public void Missing_issue_date_fails()
    {
        var req = Valid();
        req.IssueDate = "";
        var result = _sut.Validate(req);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "Data wystawienia jest wymagana");
    }

    [Fact]
    public void Invalid_issue_date_format_fails()
    {
        var req = Valid();
        req.IssueDate = "2025-13-45";
        var result = _sut.Validate(req);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "Data wystawienia musi być w formacie RRRR-MM-DD");
    }

    [Fact]
    public void Null_seller_fails()
    {
        var req = Valid();
        req.Seller = null!;
        var result = _sut.Validate(req);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "Dane sprzedawcy są wymagane");
    }

    [Fact]
    public void Empty_seller_nip_fails()
    {
        var req = Valid();
        req.Seller.Nip = "";
        var result = _sut.Validate(req);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "NIP sprzedawcy jest wymagany");
    }

    [Fact]
    public void Empty_buyer_address_fails()
    {
        var req = Valid();
        req.Buyer.AddressLine1 = "";
        var result = _sut.Validate(req);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "Adres nabywcy jest wymagany");
    }

    [Fact]
    public void Empty_items_list_fails()
    {
        var req = Valid();
        req.Items = [];
        var result = _sut.Validate(req);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "Faktura musi zawierać przynajmniej jedną pozycję");
    }

    [Fact]
    public void Item_with_zero_quantity_fails()
    {
        var req = Valid();
        req.Items = [new InvoiceItem { Name = "X", Quantity = 0, UnitPriceNet = 100m }];
        var result = _sut.Validate(req);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "Ilość musi być większa od 0");
    }

    [Fact]
    public void Item_with_negative_price_fails()
    {
        var req = Valid();
        req.Items = [new InvoiceItem { Name = "X", Quantity = 1, UnitPriceNet = -1m }];
        var result = _sut.Validate(req);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "Cena nie może być ujemna");
    }

    [Fact]
    public void Item_with_zero_price_passes()
    {
        var req = Valid();
        req.Items = [new InvoiceItem { Name = "Prezent", Quantity = 1, UnitPriceNet = 0m }];
        _sut.Validate(req).IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(-0.01)]
    [InlineData(100.01)]
    public void Item_with_discount_outside_percentage_range_fails(decimal discount)
    {
        var req = Valid();
        req.Items[0].DiscountPercent = discount;

        var result = _sut.Validate(req);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Items[0].DiscountPercent");
    }

    [Theory]
    [InlineData("2025-02-30")]
    [InlineData("15.01.2025")]
    [InlineData("2025-1-5")]
    public void Invalid_issue_calendar_date_fails(string issueDate)
    {
        var req = Valid();
        req.IssueDate = issueDate;

        _sut.Validate(req).IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData("24")]
    [InlineData("")]
    [InlineData("abc")]
    public void Unsupported_vat_rate_fails(string vatRate)
    {
        var req = Valid();
        req.Items[0].VatRate = vatRate;

        _sut.Validate(req).IsValid.Should().BeFalse();
    }

    [Fact]
    public void Invalid_nip_shape_fails()
    {
        var req = Valid();
        req.Buyer.Nip = "ABC";

        _sut.Validate(req).IsValid.Should().BeFalse();
    }
}
