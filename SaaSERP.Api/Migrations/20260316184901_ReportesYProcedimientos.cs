using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SaaSERP.Api.Migrations
{
    // Deja el nombre de la clase exactamente como Visual Studio lo generó
    public partial class ReportesYProcedimientos : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. PEGA ESTO ADENTRO DEL UP
            migrationBuilder.Sql(@"
                CREATE VIEW Operacion.vw_ResumenVentasDiarias AS
                SELECT 
                    NegocioId, 
                    CAST(FechaCreacion AS DATE) AS Fecha,
                    COUNT(Id) AS TotalOrdenes,
                    SUM(Total) AS IngresoTotal
                FROM Operacion.Comandas
                WHERE Estado = 'Lista' OR Estado = 'Entregada'
                GROUP BY NegocioId, CAST(FechaCreacion AS DATE)
            ");

            migrationBuilder.Sql(@"
                CREATE PROCEDURE Operacion.sp_CerrarTicketsAntiguos
                    @NegocioId INT,
                    @HorasAntiguedad INT
                AS
                BEGIN
                    SET NOCOUNT ON;
                    UPDATE Operacion.Tickets
                    SET Estado = 'Cobrado', MontoCalculado = 0 
                    WHERE NegocioId = @NegocioId 
                      AND Estado = 'Activo' 
                      AND DATEDIFF(HOUR, HoraEntrada, GETUTCDATE()) > @HorasAntiguedad;
                END
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // 2. PEGA ESTO ADENTRO DEL DOWN
            migrationBuilder.Sql("DROP VIEW IF EXISTS Operacion.vw_ResumenVentasDiarias");
            migrationBuilder.Sql("DROP PROCEDURE IF EXISTS Operacion.sp_CerrarTicketsAntiguos");
        }
    }
}