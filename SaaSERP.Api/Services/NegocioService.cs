using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using SaaSERP.Api.Models;
using System.Threading.Tasks;

namespace SaaSERP.Api.Services
{
    public class NegocioService : INegocioService
    {
        private readonly string _connectionString;

        public NegocioService(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") ?? throw new System.ArgumentNullException("DefaultConnection");
        }

        public async Task<Negocio?> ObtenerConfiguracionNegocioAsync(string instanciaOTelefono)
        {
            using var connection = new SqlConnection(_connectionString);
            return await connection.QueryFirstOrDefaultAsync<Negocio>(
                "[Core].[usp_Negocios_ObtenerConfiguracionPorWhatsapp]",
                new { InstanciaOTelefono = instanciaOTelefono },
                commandType: System.Data.CommandType.StoredProcedure);
        }

        public async Task<Negocio?> ObtenerConfiguracionPorIdAsync(int id)
        {
            using var connection = new SqlConnection(_connectionString);
            return await connection.QueryFirstOrDefaultAsync<Negocio>(
                "[Core].[usp_Negocios_ObtenerConfiguracionPorId]",
                new { Id = id },
                commandType: System.Data.CommandType.StoredProcedure);
        }

        public async Task<System.Collections.Generic.IEnumerable<Servicio>> ObtenerServiciosAsync(int negocioId)
        {
            using var connection = new SqlConnection(_connectionString);
            return await connection.QueryAsync<Servicio>(
                "[Core].[usp_Servicios_ObtenerActivosPorNegocio]",
                new { NegocioId = negocioId },
                commandType: System.Data.CommandType.StoredProcedure);
        }

        public async Task<System.Collections.Generic.IEnumerable<Recurso>> ObtenerRecursosAsync(int negocioId)
        {
            using var connection = new SqlConnection(_connectionString);
            return await connection.QueryAsync<Recurso>(
                "[Core].[usp_Recursos_ObtenerActivosPorNegocio]",
                new { NegocioId = negocioId },
                commandType: System.Data.CommandType.StoredProcedure);
        }
    }
}
