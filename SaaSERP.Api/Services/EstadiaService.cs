using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;

namespace SaaSERP.Api.Services
{
    public class EstadiaService : IEstadiaService
    {
        private readonly string _connectionString;

        public EstadiaService(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") 
                ?? throw new System.ArgumentNullException("DefaultConnection");
        }

        public async Task<int> RegistrarEntradaAsync(int negocioId, string placa)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.ExecuteScalarAsync<int>(
                "[Operacion].[usp_Estadias_RegistrarEntrada]", 
                new { NegocioId = negocioId, Placa = placa },
                commandType: System.Data.CommandType.StoredProcedure);
                
            return result; // Si es -1, es que ya está adentro
        }

        public async Task<(int EstadiaId, decimal MontoTotal, int MinutosTranscurridos, string Detalle)> CalcularCobroAsync(int negocioId, string placa, bool soloCalcular = true)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.QueryFirstOrDefaultAsync(
                "[Operacion].[usp_Estadias_CalcularSalida]", 
                new { NegocioId = negocioId, Placa = placa, SoloCalcular = soloCalcular },
                commandType: System.Data.CommandType.StoredProcedure);

            if (result == null) return (-1, 0, 0, "No data");

            return (
                (int)result.EstadiaId, 
                (decimal)result.MontoTotal, 
                (int)result.MinutosTranscurridos, 
                (string)result.Detalle
            );
        }
    }
}
