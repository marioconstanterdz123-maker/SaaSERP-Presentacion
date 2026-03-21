using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaaSERP.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTelefonoContactoTicket : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // NOTE: ResumenPedido DropColumn removed — column was already absent in the real DB.

            migrationBuilder.RenameColumn(
                name: "IdentificadorAtencion",
                schema: "Operacion",
                table: "Comandas",
                newName: "TipoAtencion");

            migrationBuilder.AddColumn<string>(
                name: "TelefonoContacto",
                schema: "Operacion",
                table: "Tickets",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "HoraApertura",
                schema: "Core",
                table: "Negocios",
                type: "time",
                nullable: false,
                defaultValue: new TimeSpan(0, 0, 0, 0, 0));

            migrationBuilder.AddColumn<TimeSpan>(
                name: "HoraCierre",
                schema: "Core",
                table: "Negocios",
                type: "time",
                nullable: false,
                defaultValue: new TimeSpan(0, 0, 0, 0, 0));

            // Campo para gestionar instancias de WhatsApp por negocio
            migrationBuilder.AddColumn<string>(
                name: "InstanciaWhatsApp",
                schema: "Core",
                table: "Negocios",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IdentificadorMesa",
                schema: "Operacion",
                table: "Comandas",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "NombreCliente",
                schema: "Operacion",
                table: "Comandas",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TelefonoCliente",
                schema: "Operacion",
                table: "Comandas",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "RecursoId",
                schema: "Operacion",
                table: "Citas",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ServicioId",
                schema: "Operacion",
                table: "Citas",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "DetalleComanda",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ComandaId = table.Column<int>(type: "int", nullable: false),
                    ServicioId = table.Column<int>(type: "int", nullable: false),
                    Cantidad = table.Column<int>(type: "int", nullable: false),
                    Subtotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    NotasOpcionales = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DetalleComanda", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DetalleComanda_Comandas_ComandaId",
                        column: x => x.ComandaId,
                        principalSchema: "Operacion",
                        principalTable: "Comandas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DetalleComanda_ComandaId",
                table: "DetalleComanda",
                column: "ComandaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DetalleComanda");

            migrationBuilder.DropColumn(
                name: "TelefonoContacto",
                schema: "Operacion",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "HoraApertura",
                schema: "Core",
                table: "Negocios");

            migrationBuilder.DropColumn(
                name: "HoraCierre",
                schema: "Core",
                table: "Negocios");

            migrationBuilder.DropColumn(
                name: "IdentificadorMesa",
                schema: "Operacion",
                table: "Comandas");

            migrationBuilder.DropColumn(
                name: "NombreCliente",
                schema: "Operacion",
                table: "Comandas");

            migrationBuilder.DropColumn(
                name: "TelefonoCliente",
                schema: "Operacion",
                table: "Comandas");

            migrationBuilder.DropColumn(
                name: "RecursoId",
                schema: "Operacion",
                table: "Citas");

            migrationBuilder.DropColumn(
                name: "ServicioId",
                schema: "Operacion",
                table: "Citas");

            migrationBuilder.RenameColumn(
                name: "TipoAtencion",
                schema: "Operacion",
                table: "Comandas",
                newName: "IdentificadorAtencion");

            migrationBuilder.AddColumn<string>(
                name: "ResumenPedido",
                schema: "Operacion",
                table: "Comandas",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "");
        }
    }
}
