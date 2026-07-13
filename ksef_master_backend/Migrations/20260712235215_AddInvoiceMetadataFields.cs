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
            // Some production databases already contain one or more of these
            // columns, but do not have this migration recorded in EF history.
            // Keep the migration safe for both fresh and partially-aligned
            // databases without dropping or overwriting existing data.
            migrationBuilder.Sql(
                """
                ALTER TABLE "Invoices"
                    ADD COLUMN IF NOT EXISTS "InvoiceHash" text;

                ALTER TABLE "Invoices"
                    ADD COLUMN IF NOT EXISTS "InvoicingDate" timestamp with time zone;

                ALTER TABLE "Invoices"
                    ADD COLUMN IF NOT EXISTS "PermanentStorageDate" timestamp with time zone;
                """);
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
