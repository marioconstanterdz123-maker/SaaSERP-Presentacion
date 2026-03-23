using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaaSERP.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMercadoPagoTokenProdv2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameTable(
                name: "DetalleComanda",
                newName: "DetalleComanda",
                newSchema: "Operacion");

            migrationBuilder.AddColumn<bool>(
                name: "AccesoMovil",
                schema: "Core",
                table: "Negocios",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AccesoWeb",
                schema: "Core",
                table: "Negocios",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "MercadoPagoAccessToken",
                schema: "Core",
                table: "Negocios",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ModuloHistorial",
                schema: "Core",
                table: "Negocios",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ModuloReportes",
                schema: "Core",
                table: "Negocios",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ModuloWhatsApp",
                schema: "Core",
                table: "Negocios",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "RecordatorioEnviado",
                schema: "Operacion",
                table: "Citas",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "DeliveryCredenciales",
                schema: "Core",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NegocioId = table.Column<int>(type: "int", nullable: false),
                    Plataforma = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ClientId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ClientSecret = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    WebhookSecret = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    StoreId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    PaisCode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryCredenciales", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DeliveryCredenciales_Negocios_NegocioId",
                        column: x => x.NegocioId,
                        principalSchema: "Core",
                        principalTable: "Negocios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Servicios",
                schema: "Core",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NegocioId = table.Column<int>(type: "int", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DuracionMinutos = table.Column<int>(type: "int", nullable: false),
                    Precio = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Servicios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TarifaEstadia",
                schema: "Core",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NegocioId = table.Column<int>(type: "int", nullable: false),
                    CostoPrimeraFraccion = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MinutosPrimeraFraccion = table.Column<int>(type: "int", nullable: false),
                    CostoFraccionAdicional = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MinutosFraccionAdicional = table.Column<int>(type: "int", nullable: false),
                    MinutosToleranciaEntrada = table.Column<int>(type: "int", nullable: false),
                    MinutosToleranciaFraccion = table.Column<int>(type: "int", nullable: false),
                    BoletoPerdido = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    HeaderTicket = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    FooterTicket = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TarifaEstadia", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TarifaEstadia_Negocios_NegocioId",
                        column: x => x.NegocioId,
                        principalSchema: "Core",
                        principalTable: "Negocios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SkuTerceros",
                schema: "Core",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NegocioId = table.Column<int>(type: "int", nullable: false),
                    Plataforma = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    SkuExterno = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ServicioId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SkuTerceros", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SkuTerceros_Negocios_NegocioId",
                        column: x => x.NegocioId,
                        principalSchema: "Core",
                        principalTable: "Negocios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SkuTerceros_Servicios_ServicioId",
                        column: x => x.ServicioId,
                        principalSchema: "Core",
                        principalTable: "Servicios",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryCredenciales_NegocioId",
                schema: "Core",
                table: "DeliveryCredenciales",
                column: "NegocioId");

            migrationBuilder.CreateIndex(
                name: "IX_SkuTerceros_NegocioId",
                schema: "Core",
                table: "SkuTerceros",
                column: "NegocioId");

            migrationBuilder.CreateIndex(
                name: "IX_SkuTerceros_ServicioId",
                schema: "Core",
                table: "SkuTerceros",
                column: "ServicioId");

            migrationBuilder.CreateIndex(
                name: "IX_TarifaEstadia_NegocioId",
                schema: "Core",
                table: "TarifaEstadia",
                column: "NegocioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DeliveryCredenciales",
                schema: "Core");

            migrationBuilder.DropTable(
                name: "SkuTerceros",
                schema: "Core");

            migrationBuilder.DropTable(
                name: "TarifaEstadia",
                schema: "Core");

            migrationBuilder.DropTable(
                name: "Servicios",
                schema: "Core");

            migrationBuilder.DropColumn(
                name: "AccesoMovil",
                schema: "Core",
                table: "Negocios");

            migrationBuilder.DropColumn(
                name: "AccesoWeb",
                schema: "Core",
                table: "Negocios");

            migrationBuilder.DropColumn(
                name: "MercadoPagoAccessToken",
                schema: "Core",
                table: "Negocios");

            migrationBuilder.DropColumn(
                name: "ModuloHistorial",
                schema: "Core",
                table: "Negocios");

            migrationBuilder.DropColumn(
                name: "ModuloReportes",
                schema: "Core",
                table: "Negocios");

            migrationBuilder.DropColumn(
                name: "ModuloWhatsApp",
                schema: "Core",
                table: "Negocios");

            migrationBuilder.DropColumn(
                name: "RecordatorioEnviado",
                schema: "Operacion",
                table: "Citas");

            migrationBuilder.RenameTable(
                name: "DetalleComanda",
                schema: "Operacion",
                newName: "DetalleComanda");
        }
    }
}
