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
            DateType = "InvoicingDate",
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
    [InlineData("InvoicingDate")]
    [InlineData("PermanentStorage")]
    [InlineData("AcquisitionTimestamp")]
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
    public void Range_over_366_days_fails()
    {
        var req = Valid();
        req.DateRange.From = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        req.DateRange.To = req.DateRange.From.AddDays(367);
        var result = _sut.Validate(req);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage == "Zakres dat nie może przekraczać 12 miesięcy");
    }

    [Fact]
    public void Range_of_exactly_366_days_passes()
    {
        var req = Valid();
        req.DateRange.From = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        req.DateRange.To = req.DateRange.From.AddDays(366);
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
        result.Errors.Should().Contain(e => e.ErrorMessage == "MaxResults musi być >= 1");
    }

    [Fact]
    public void Max_results_one_passes()
    {
        var req = Valid();
        req.MaxResults = 1;
        _sut.Validate(req).IsValid.Should().BeTrue();
    }
}
