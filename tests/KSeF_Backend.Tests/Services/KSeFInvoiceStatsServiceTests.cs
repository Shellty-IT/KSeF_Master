using FluentAssertions;
using KSeF.Backend.Models.Requests;
using KSeF.Backend.Models.Responses.Invoice;
using KSeF.Backend.Services.Interfaces.KSeF;
using KSeF.Backend.Services.KSeF.Invoice;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace KSeF_Backend.Tests.Services;

public class KSeFInvoiceStatsServiceTests
{
    [Fact]
    public async Task Twelve_month_period_is_split_into_api_compliant_windows()
    {
        var queryService = new RecordingQueryService();
        var service = new KSeFInvoiceStatsService(
            queryService,
            NullLogger<KSeFInvoiceStatsService>.Instance);

        var result = await service.GetStatsAsync(12);

        queryService.Requests.Should().HaveCount(8);
        queryService.Requests.Should().OnlyContain(request =>
            request.DateRange.To <= request.DateRange.From.AddMonths(3));
        queryService.Requests.Count(request => request.SubjectType == "Subject1").Should().Be(4);
        queryService.Requests.Count(request => request.SubjectType == "Subject2").Should().Be(4);
        result.IssuedCount.Should().Be(4);
        result.ReceivedCount.Should().Be(4);
        result.TopContractors.Should().ContainKey("Nabywca");
        result.TopContractors.Should().ContainKey("Kontrahent");
    }

    private sealed class RecordingQueryService : IKSeFInvoiceQueryService
    {
        public List<InvoiceQueryRequest> Requests { get; } = [];

        public Task<InvoiceQueryResponse> QueryInvoicesAsync(
            InvoiceQueryRequest request,
            CancellationToken cancellationToken = default)
        {
            Requests.Add(request);
            var index = Requests.Count;
            return Task.FromResult(new InvoiceQueryResponse
            {
                Invoices =
                [
                    new InvoiceMetadata
                    {
                        KsefNumber = $"ksef-{index}",
                        InvoicingDate = request.DateRange.From.AddDays(1),
                        GrossAmount = 100m,
                        NetAmount = 80m,
                        Currency = "PLN",
                        Seller = new PartyInfo { Name = "Kontrahent" },
                        Buyer = new BuyerInfo { Name = "Nabywca" }
                    }
                ],
                TotalCount = 1,
                PagesProcessed = 1
            });
        }

        public Task<List<KSeF.Backend.Models.Data.Invoice>> GetCachedInvoicesAsync(int companyProfileId) =>
            Task.FromResult(new List<KSeF.Backend.Models.Data.Invoice>());

        public Task<List<KSeF.Backend.Models.Data.Invoice>> GetCachedInvoicesAsync(
            int companyProfileId,
            InvoiceQueryRequest filter) =>
            Task.FromResult(new List<KSeF.Backend.Models.Data.Invoice>());
    }
}
