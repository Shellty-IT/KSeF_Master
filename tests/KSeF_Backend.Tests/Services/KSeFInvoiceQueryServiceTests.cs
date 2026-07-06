using FluentAssertions;
using KSeF.Backend.Models.Data;
using KSeF.Backend.Models.Requests;
using KSeF.Backend.Repositories;
using KSeF.Backend.Services.Interfaces.KSeF;
using KSeF.Backend.Services.KSeF.Invoice;
using KSeF.Backend.Services.KSeF.Session;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace KSeF_Backend.Tests.Services;

public class KSeFInvoiceQueryServiceTests
{
    private class FakeInvoiceRepository : IInvoiceRepository
    {
        private readonly List<Invoice> _invoices;
        public FakeInvoiceRepository(List<Invoice> invoices) => _invoices = invoices;

        public Task<List<Invoice>> GetByCompanyProfileIdAsync(int companyProfileId) =>
            Task.FromResult(_invoices.Where(i => i.CompanyProfileId == companyProfileId).ToList());

        public Task<Invoice?> GetByKsefReferenceNumberAsync(string ksefReferenceNumber) =>
            throw new NotSupportedException();

        public Task<DateTime?> GetLatestAcquisitionTimestampAsync(int companyProfileId, string direction) =>
            throw new NotSupportedException();

        public Task<List<string>> GetExistingKsefNumbersAsync(int companyProfileId) =>
            throw new NotSupportedException();

        public Task UpsertManyAsync(List<Invoice> invoices) => throw new NotSupportedException();
        public Task DeleteByCompanyProfileIdAsync(int companyProfileId) => throw new NotSupportedException();
        public Task SaveChangesAsync() => throw new NotSupportedException();
    }

    private static KSeFInvoiceQueryService BuildService(List<Invoice> invoices)
    {
        return new KSeFInvoiceQueryService(
            httpClientFactory: null!,
            authService: null!,
            session: new KSeFSessionManager(NullLogger<KSeFSessionManager>.Instance),
            invoiceRepository: new FakeInvoiceRepository(invoices),
            logger: NullLogger<KSeFInvoiceQueryService>.Instance);
    }

    private static Invoice Make(string direction, DateTime? invoiceDate) => new()
    {
        CompanyProfileId = 1,
        Direction = direction,
        InvoiceDate = invoiceDate,
        KsefReferenceNumber = Guid.NewGuid().ToString(),
    };

    [Fact]
    public async Task Filters_by_direction_and_date_range()
    {
        var now = DateTime.UtcNow;
        var invoices = new List<Invoice>
        {
            Make("received", now.AddDays(-5)),   // in range, correct direction
            Make("issued", now.AddDays(-5)),     // in range, wrong direction
            Make("received", now.AddDays(-90)),  // out of range, correct direction
        };
        var service = BuildService(invoices);

        var result = await service.GetCachedInvoicesAsync(1, new InvoiceQueryRequest
        {
            SubjectType = "Subject2",
            DateRange = new DateRangeFilter { From = now.AddDays(-30), To = now }
        });

        result.Should().HaveCount(1);
        result[0].Direction.Should().Be("received");
    }

    [Fact]
    public async Task Subject1_maps_to_issued_direction()
    {
        var now = DateTime.UtcNow;
        var invoices = new List<Invoice>
        {
            Make("issued", now),
            Make("received", now),
        };
        var service = BuildService(invoices);

        var result = await service.GetCachedInvoicesAsync(1, new InvoiceQueryRequest
        {
            SubjectType = "Subject1",
            DateRange = new DateRangeFilter { From = now.AddDays(-1), To = now.AddDays(1) }
        });

        result.Should().ContainSingle().Which.Direction.Should().Be("issued");
    }
}
