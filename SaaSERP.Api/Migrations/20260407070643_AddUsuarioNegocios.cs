using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaaSERP.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUsuarioNegocios : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "Studio");

            migrationBuilder.AddColumn<bool>(
                name: "EliminadoLogico",
                schema: "Core",
                table: "Negocios",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaEliminacion",
                schema: "Core",
                table: "Negocios",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaVencimientoSuscripcion",
                schema: "Core",
                table: "Negocios",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "ModuloCRM",
                schema: "Core",
                table: "Negocios",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ModuloWhatsAppIA",
                schema: "Core",
                table: "Negocios",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "TiempoSilencioMinutos",
                schema: "Core",
                table: "Negocios",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TrabajadorId",
                schema: "Operacion",
                table: "Citas",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ClientesCRM",
                schema: "Studio",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NegocioId = table.Column<int>(type: "int", nullable: false),
                    Telefono = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    NombreDetectado = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PrimerContacto = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UltimaInteraccion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TotalCitasCompletadas = table.Column<int>(type: "int", nullable: false),
                    NivelLealtad = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    DescuentoActivo = table.Column<decimal>(type: "decimal(5,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientesCRM", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ReglasBonificacion",
                schema: "Studio",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NegocioId = table.Column<int>(type: "int", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CitasRequeridas = table.Column<int>(type: "int", nullable: false),
                    VentanaMeses = table.Column<int>(type: "int", nullable: false),
                    NivelNombre = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Descuento = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    Activa = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReglasBonificacion", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Trabajadores",
                schema: "Studio",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NegocioId = table.Column<int>(type: "int", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Telefono = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    InstanciaWhatsApp = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ApiKeyEvolution = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Trabajadores", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UsuarioNegocios",
                schema: "Core",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    NegocioId = table.Column<int>(type: "int", nullable: false),
                    Rol = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuarioNegocios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UsuarioNegocios_Negocios_NegocioId",
                        column: x => x.NegocioId,
                        principalSchema: "Core",
                        principalTable: "Negocios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UsuarioNegocios_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalSchema: "Core",
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChatSessions",
                schema: "Studio",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NegocioId = table.Column<int>(type: "int", nullable: false),
                    TrabajadorId = table.Column<int>(type: "int", nullable: true),
                    NumeroCliente = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    NombreCliente = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ModoSilencio = table.Column<bool>(type: "bit", nullable: false),
                    EsperandoConfirmacionHandoff = table.Column<bool>(type: "bit", nullable: false),
                    UltimoMensaje = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SilencioActivadoEn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    WhisperEnviado = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatSessions_Trabajadores_TrabajadorId",
                        column: x => x.TrabajadorId,
                        principalSchema: "Studio",
                        principalTable: "Trabajadores",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "HorariosTrabajadores",
                schema: "Studio",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TrabajadorId = table.Column<int>(type: "int", nullable: false),
                    DiaSemana = table.Column<int>(type: "int", nullable: false),
                    HoraInicio = table.Column<TimeSpan>(type: "time", nullable: false),
                    HoraFin = table.Column<TimeSpan>(type: "time", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HorariosTrabajadores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HorariosTrabajadores_Trabajadores_TrabajadorId",
                        column: x => x.TrabajadorId,
                        principalSchema: "Studio",
                        principalTable: "Trabajadores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Citas_TrabajadorId",
                schema: "Operacion",
                table: "Citas",
                column: "TrabajadorId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatSessions_NegocioId_NumeroCliente",
                schema: "Studio",
                table: "ChatSessions",
                columns: new[] { "NegocioId", "NumeroCliente" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChatSessions_TrabajadorId",
                schema: "Studio",
                table: "ChatSessions",
                column: "TrabajadorId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientesCRM_NegocioId_Telefono",
                schema: "Studio",
                table: "ClientesCRM",
                columns: new[] { "NegocioId", "Telefono" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_HorariosTrabajadores_TrabajadorId",
                schema: "Studio",
                table: "HorariosTrabajadores",
                column: "TrabajadorId");

            migrationBuilder.CreateIndex(
                name: "IX_UsuarioNegocios_NegocioId",
                schema: "Core",
                table: "UsuarioNegocios",
                column: "NegocioId");

            migrationBuilder.CreateIndex(
                name: "IX_UsuarioNegocios_UsuarioId_NegocioId",
                schema: "Core",
                table: "UsuarioNegocios",
                columns: new[] { "UsuarioId", "NegocioId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Citas_Trabajadores_TrabajadorId",
                schema: "Operacion",
                table: "Citas",
                column: "TrabajadorId",
                principalSchema: "Studio",
                principalTable: "Trabajadores",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Citas_Trabajadores_TrabajadorId",
                schema: "Operacion",
                table: "Citas");

            migrationBuilder.DropTable(
                name: "ChatSessions",
                schema: "Studio");

            migrationBuilder.DropTable(
                name: "ClientesCRM",
                schema: "Studio");

            migrationBuilder.DropTable(
                name: "HorariosTrabajadores",
                schema: "Studio");

            migrationBuilder.DropTable(
                name: "ReglasBonificacion",
                schema: "Studio");

            migrationBuilder.DropTable(
                name: "UsuarioNegocios",
                schema: "Core");

            migrationBuilder.DropTable(
                name: "Trabajadores",
                schema: "Studio");

            migrationBuilder.DropIndex(
                name: "IX_Citas_TrabajadorId",
                schema: "Operacion",
                table: "Citas");

            migrationBuilder.DropColumn(
                name: "EliminadoLogico",
                schema: "Core",
                table: "Negocios");

            migrationBuilder.DropColumn(
                name: "FechaEliminacion",
                schema: "Core",
                table: "Negocios");

            migrationBuilder.DropColumn(
                name: "FechaVencimientoSuscripcion",
                schema: "Core",
                table: "Negocios");

            migrationBuilder.DropColumn(
                name: "ModuloCRM",
                schema: "Core",
                table: "Negocios");

            migrationBuilder.DropColumn(
                name: "ModuloWhatsAppIA",
                schema: "Core",
                table: "Negocios");

            migrationBuilder.DropColumn(
                name: "TiempoSilencioMinutos",
                schema: "Core",
                table: "Negocios");

            migrationBuilder.DropColumn(
                name: "TrabajadorId",
                schema: "Operacion",
                table: "Citas");
        }
    }
}
