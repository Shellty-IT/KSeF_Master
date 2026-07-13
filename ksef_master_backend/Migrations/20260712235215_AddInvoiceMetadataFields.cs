using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KSeF_Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddInvoiceMetadataFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "InvoiceHash",
                table: "Invoices",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "InvoicingDate",
                table: "Invoices",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PermanentStorageDate",
                table: "Invoices",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InvoiceHash",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "InvoicingDate",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "PermanentStorageDate",
                table: "Invoices");
        }
    }
}
