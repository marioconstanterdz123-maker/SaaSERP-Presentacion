using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaaSERP.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarEsquemas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "Operacion");

            migrationBuilder.EnsureSchema(
                name: "Core");

            migrationBuilder.RenameTable(
                name: "Usuarios",
                newName: "Usuarios",
                newSchema: "Core");

            migrationBuilder.RenameTable(
                name: "Tickets",
                newName: "Tickets",
                newSchema: "Operacion");

            migrationBuilder.RenameTable(
                name: "Negocios",
                newName: "Negocios",
                newSchema: "Core");

            migrationBuilder.RenameTable(
                name: "Comandas",
                newName: "Comandas",
                newSchema: "Operacion");

            migrationBuilder.RenameTable(
                name: "Citas",
                newName: "Citas",
                newSchema: "Operacion");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameTable(
                name: "Usuarios",
                schema: "Core",
                newName: "Usuarios");

            migrationBuilder.RenameTable(
                name: "Tickets",
                schema: "Operacion",
                newName: "Tickets");

            migrationBuilder.RenameTable(
                name: "Negocios",
                schema: "Core",
                newName: "Negocios");

            migrationBuilder.RenameTable(
                name: "Comandas",
                schema: "Operacion",
                newName: "Comandas");

            migrationBuilder.RenameTable(
                name: "Citas",
                schema: "Operacion",
                newName: "Citas");
        }
    }
}
