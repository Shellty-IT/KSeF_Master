using FluentAssertions;
using KSeF.Backend.Models.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace KSeF_Backend.Tests.Data;

public class AppDbContextModelTests
{
    [Fact]
    public void Ksef_number_is_unique_per_company_not_globally()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=model_test;Username=test;Password=test")
            .Options;
        using var context = new AppDbContext(options);

        var invoiceType = context.Model.FindEntityType(typeof(Invoice));
        var uniqueIndex = invoiceType!.GetIndexes().Single(index => index.IsUnique);

        uniqueIndex.Properties.Select(property => property.Name)
            .Should().Equal(nameof(Invoice.CompanyProfileId), nameof(Invoice.KsefReferenceNumber));
    }
}
