using FluentAssertions;
using KSeF.Backend.Models.Requests;
using KSeF.Backend.Validators;
using Xunit;

namespace KSeF_Backend.Tests.Validators;

public class GeneratePdfRequestValidatorTests
{
    private readonly GeneratePdfRequestValidator _validator = new();

    [Fact]
    public void Valid_pdf_request_passes()
    {
        var result = _validator.Validate(Valid());

        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("not-base64")]
    [InlineData("AQID")]
    public void Invalid_invoice_hash_fails(string hash)
    {
        var request = Valid();
        request.InvoiceHash = hash;

        _validator.Validate(request).IsValid.Should().BeFalse();
    }

    private static GeneratePdfRequest Valid() => new()
    {
        Source = "local",
        KsefEnvironment = "Production",
        InvoiceNumber = "FV/1/2026",
        IssueDate = "2026-07-13",
        InvoiceHash = Convert.ToBase64String(new byte[32]),
        Seller = new PdfPartyData
        {
            Nip = "5260001228",
            Name = "Sprzedawca"
        }
    };
}
