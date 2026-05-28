using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KSeF_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddExternalDrafts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ExternalDrafts",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SmartQuoteId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    OfferNumber = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    IssueDate = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    DueDate = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    SellerName = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    SellerNip = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    SellerAddress = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    SellerCity = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SellerPostalCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    BuyerName = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    BuyerNip = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    BuyerAddress = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    BuyerCity = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    BuyerPostalCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Items = table.Column<string>(type: "jsonb", nullable: false),
                    TotalNet = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalVat = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalGross = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    PaymentDays = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ProcessedBy = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    RejectionReason = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExternalDrafts", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ExternalDrafts_SellerNip",
                table: "ExternalDrafts",
                column: "SellerNip");

            migrationBuilder.CreateIndex(
                name: "IX_ExternalDrafts_SmartQuoteId",
                table: "ExternalDrafts",
                column: "SmartQuoteId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ExternalDrafts_Status",
                table: "ExternalDrafts",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExternalDrafts");
        }
    }
}
