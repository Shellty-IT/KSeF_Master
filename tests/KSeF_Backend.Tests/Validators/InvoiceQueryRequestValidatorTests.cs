using FluentAssertions;
using FluentValidation;
using KSeF.Backend.Models.Requests;
using KSeF.Backend.Validators;
using Xunit;

namespace KSeF_Backend.Tests.Validators;

public class InvoiceQueryRequestValidatorTests
{
    private readonly IValidator<InvoiceQueryRequest> _sut = new InvoiceQueryRequestValidator();

    private static InvoiceQueryRequest Valid() => new()
    {
        SubjectType = "Subject1",
        DateRange = new DateRangeFilter
        {
            DateType = "Invoicing",
            From = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            To = new DateTime(2025, 3, 31, 0, 0, 0, DateTimeKind.Utc)
        }
    };

    [Theory]
    [InlineData("Subject1")]
    [InlineData("Subject2")]
    public void Valid_subject_types_pass(string type)
    {
        var req = Valid();
        req.SubjectType = type;
        _sut.Validate(req).IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("subject1")]
    [InlineData("SUBJECT2")]
    [InlineData("Subject3")]
    [InlineData("")]
    public void Invalid_subject_type_fails(string type)
    {
        var req = Valid();
        req.SubjectType = type;
        var result = _sut.Validate(req);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "SubjectType");
    }

    [Theory]
    [InlineData("Issue")]
    [InlineData("Invoicing")]
    [InlineData("PermanentStorage")]
    public void Valid_date_types_pass(string dateType)
    {
        var req = Valid();
        req.DateRange.DateType = dateType;
        _sut.Validate(req).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Invalid_date_type_fails()
    {
        var req = Valid();
        req.DateRange.DateType = "UnknownType";
        var result = _sut.Validate(req);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "DateRange.DateType");
    }

    [Fact]
    public void From_after_to_fails()
    {
        var req = Valid();
        req.DateRange.From = new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc);
        req.DateRange.To = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var result = _sut.Validate(req);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "DateRange.From nie może być późniejszy niż DateRange.To");
    }

    [Fact]
    public void Range_over_three_months_fails()
    {
        var req = Valid();
        req.DateRange.From = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        req.DateRange.To = req.DateRange.From.AddDays(94);
        var result = _sut.Validate(req);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "Zakres dat nie może przekraczać 3 miesięcy");
    }

    [Fact]
    public void Range_of_exactly_three_calendar_months_passes()
    {
        var req = Valid();
        req.DateRange.From = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        req.DateRange.To = req.DateRange.From.AddMonths(3);
        _sut.Validate(req).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Amount_from_greater_than_amount_to_fails()
    {
        var req = Valid();
        req.AmountFrom = 1000m;
        req.AmountTo = 500m;
        var result = _sut.Validate(req);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "AmountFrom nie może być większy niż AmountTo");
    }

    [Fact]
    public void Amount_range_equal_passes()
    {
        var req = Valid();
        req.AmountFrom = 500m;
        req.AmountTo = 500m;
        _sut.Validate(req).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Max_results_zero_fails()
    {
        var req = Valid();
        req.MaxResults = 0;
        var result = _sut.Validate(req);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "MaxResults.Value");
    }

    [Fact]
    public void Max_results_one_passes()
    {
        var req = Valid();
        req.MaxResults = 1;
        _sut.Validate(req).IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(9)]
    [InlineData(251)]
    public void Page_size_outside_api_limits_fails(int pageSize)
    {
        var req = Valid();
        req.PageSize = pageSize;

        _sut.Validate(req).IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData("123")]
    [InlineData("123456789X")]
    public void Invalid_contractor_nip_fails(string nip)
    {
        var req = Valid();
        req.ContractorNip = nip;

        _sut.Validate(req).IsValid.Should().BeFalse();
    }
}
