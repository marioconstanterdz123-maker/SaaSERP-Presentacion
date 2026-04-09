using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using SaaSERP.Api.Models;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

namespace SaaSERP.Api.Services
{
    public class ComandaService : IComandaService
    {
        private readonly string _connectionString;

        public ComandaService(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") 
                ?? throw new System.ArgumentNullException("DefaultConnection");
        }

        public async Task<(int ComandaId, decimal TotalCalculado)> CrearComandaAsync(Comanda comanda, List<DetalleComanda> detalles)
        {
            using var connection = new SqlConnection(_connectionString);

            // Crear DataTable para el Table-Valued Parameter
            var dt = new DataTable();
            dt.Columns.Add("ServicioId", typeof(int));
            dt.Columns.Add("Cantidad", typeof(int));
            dt.Columns.Add("Notas", typeof(string));

            foreach (var d in detalles)
            {
                dt.Rows.Add(d.ServicioId, d.Cantidad, d.NotasOpcionales ?? "");
            }

            var parameters = new DynamicParameters();
            parameters.Add("@NegocioId", comanda.NegocioId);
            parameters.Add("@Telefono", comanda.TelefonoCliente);
            parameters.Add("@NombreCliente", comanda.NombreCliente);
            parameters.Add("@TipoAtencion", comanda.TipoAtencion);
            parameters.Add("@IdentificadorMesa", comanda.IdentificadorMesa);
            // El parámetro TVP
            parameters.Add("@Detalles", dt.AsTableValuedParameter("Operacion.udt_DetalleComanda"));

            var result = await connection.QueryFirstOrDefaultAsync(
                "[Operacion].[usp_Comandas_Crear]", 
                parameters,
                commandType: CommandType.StoredProcedure);

            if (result == null) return (-1, 0);

            int outId = Convert.ToInt32(result.ComandaId);
            decimal outTotal = Convert.ToDecimal(result.TotalCobrar);

            // Parche temporal para asegurar que la hora de la comanda quede en Zona Horaria Centro (México GMT-6) y no en UTC
            await connection.ExecuteAsync("UPDATE [Operacion].[Comandas] SET FechaCreacion = DATEADD(hour, -6, GETUTCDATE()) WHERE Id = @Id", new { Id = outId });

            return (outId, outTotal);
        }

        public async Task<Comanda?> ObtenerEstadoComandaAsync(int negocioId, string telefonoCliente)
        {
            using var connection = new SqlConnection(_connectionString);
            return await connection.QueryFirstOrDefaultAsync<Comanda>(
                "[Operacion].[usp_Comandas_ConsultarEstado]",
                new { NegocioId = negocioId, Telefono = telefonoCliente },
                commandType: CommandType.StoredProcedure);
        }
    }
}
