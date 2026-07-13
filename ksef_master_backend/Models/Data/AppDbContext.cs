// Models/Data/AppDbContext.cs
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using KSeF.Backend.Models;

namespace KSeF.Backend.Models.Data;

public class AppDbContext : DbContext
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<CompanyProfile> CompanyProfiles => Set<CompanyProfile>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<ExternalDraft> ExternalDrafts => Set<ExternalDraft>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).IsRequired().HasMaxLength(256);
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.CreatedAt).IsRequired();

            entity.HasOne(e => e.CompanyProfile)
                .WithOne(e => e.User)
                .HasForeignKey<CompanyProfile>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CompanyProfile>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId).IsUnique();
            entity.HasIndex(e => e.Nip);

            entity.Property(e => e.CompanyName).IsRequired().HasMaxLength(300);
            entity.Property(e => e.Nip).IsRequired().HasMaxLength(10);
            entity.Property(e => e.AuthMethod).IsRequired().HasMaxLength(20).HasDefaultValue("token");
            entity.Property(e => e.IsActive).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();

            entity.Property(e => e.KsefTokenEncrypted).HasMaxLength(2000);
            entity.Property(e => e.CertificateEncrypted).HasMaxLength(10000);
            entity.Property(e => e.PrivateKeyEncrypted).HasMaxLength(10000);
            entity.Property(e => e.CertificatePasswordEncrypted).HasMaxLength(500);
            entity.Property(e => e.LastSuccessfulAuthMethod).HasMaxLength(20);

            entity.HasMany(e => e.Invoices)
                .WithOne(e => e.CompanyProfile)
                .HasForeignKey(e => e.CompanyProfileId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => new { e.CompanyProfileId, e.KsefReferenceNumber }).IsUnique();
            entity.HasIndex(e => e.CompanyProfileId);
            entity.HasIndex(e => new { e.CompanyProfileId, e.Direction });
            entity.HasIndex(e => new { e.CompanyProfileId, e.InvoiceDate });

            entity.Property(e => e.KsefReferenceNumber).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Nip).IsRequired().HasMaxLength(10);
            entity.Property(e => e.InvoiceType).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Direction).IsRequired().HasMaxLength(10);
            entity.Property(e => e.InvoiceNumber).HasMaxLength(100);
            entity.Property(e => e.SellerNip).HasMaxLength(20);
            entity.Property(e => e.SellerName).HasMaxLength(300);
            entity.Property(e => e.BuyerNip).HasMaxLength(20);
            entity.Property(e => e.BuyerName).HasMaxLength(300);
            entity.Property(e => e.Currency).HasMaxLength(3);
            entity.Property(e => e.NetAmount).HasPrecision(18, 2);
            entity.Property(e => e.VatAmount).HasPrecision(18, 2);
            entity.Property(e => e.GrossAmount).HasPrecision(18, 2);
            entity.Property(e => e.KsefEnvironment).IsRequired().HasMaxLength(20);
        });

        modelBuilder.Entity<ExternalDraft>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.SmartQuoteId).IsUnique();
            entity.HasIndex(e => e.SellerNip);
            entity.HasIndex(e => e.Status);

            entity.Property(e => e.Id).HasMaxLength(64);
            entity.Property(e => e.SmartQuoteId).IsRequired().HasMaxLength(128);
            entity.Property(e => e.OfferNumber).IsRequired().HasMaxLength(64);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(16);
            entity.Property(e => e.IssueDate).IsRequired().HasMaxLength(10);
            entity.Property(e => e.DueDate).IsRequired().HasMaxLength(10);

            entity.Property(e => e.SellerName).IsRequired().HasMaxLength(300);
            entity.Property(e => e.SellerNip).IsRequired().HasMaxLength(10);
            entity.Property(e => e.SellerAddress).HasMaxLength(300);
            entity.Property(e => e.SellerCity).HasMaxLength(100);
            entity.Property(e => e.SellerPostalCode).HasMaxLength(10);

            entity.Property(e => e.BuyerName).IsRequired().HasMaxLength(300);
            entity.Property(e => e.BuyerNip).IsRequired().HasMaxLength(10);
            entity.Property(e => e.BuyerAddress).HasMaxLength(300);
            entity.Property(e => e.BuyerCity).HasMaxLength(100);
            entity.Property(e => e.BuyerPostalCode).HasMaxLength(10);

            entity.Property(e => e.TotalNet).HasPrecision(18, 2);
            entity.Property(e => e.TotalVat).HasPrecision(18, 2);
            entity.Property(e => e.TotalGross).HasPrecision(18, 2);
            entity.Property(e => e.Currency).HasMaxLength(3);

            entity.Property(e => e.ProcessedBy).HasMaxLength(256);
            entity.Property(e => e.RejectionReason).HasMaxLength(2000);

            entity.Property(e => e.Items)
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonOpts),
                    v => JsonSerializer.Deserialize<List<ExternalDraftItem>>(v, JsonOpts) ?? new List<ExternalDraftItem>())
                .Metadata.SetValueComparer(new Microsoft.EntityFrameworkCore.ChangeTracking.ValueComparer<List<ExternalDraftItem>>(
                    (a, b) => JsonSerializer.Serialize(a, JsonOpts) == JsonSerializer.Serialize(b, JsonOpts),
                    v => v == null ? 0 : JsonSerializer.Serialize(v, JsonOpts).GetHashCode(),
                    v => JsonSerializer.Deserialize<List<ExternalDraftItem>>(JsonSerializer.Serialize(v, JsonOpts), JsonOpts) ?? new List<ExternalDraftItem>()));
        });
    }
}
