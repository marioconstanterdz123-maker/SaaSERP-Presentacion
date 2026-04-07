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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UsuarioNegocios",
                schema: "Core");
        }
    }
}
