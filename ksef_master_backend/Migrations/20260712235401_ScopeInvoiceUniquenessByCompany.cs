using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KSeF_Backend.Migrations
{
    /// <inheritdoc />
    public partial class ScopeInvoiceUniquenessByCompany : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Invoices_KsefReferenceNumber",
                table: "Invoices");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_CompanyProfileId_KsefReferenceNumber",
                table: "Invoices",
                columns: new[] { "CompanyProfileId", "KsefReferenceNumber" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Invoices_CompanyProfileId_KsefReferenceNumber",
                table: "Invoices");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_KsefReferenceNumber",
                table: "Invoices",
                column: "KsefReferenceNumber",
                unique: true);
        }
    }
}
