using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SaaSERP.Api.Services
{
    public class ChatMemoryService : IChatMemoryService
    {
        private readonly string _connectionString;

        public ChatMemoryService(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") 
                ?? throw new System.ArgumentNullException("DefaultConnection");
        }

        public Task InicializarTablaAsync()
        {
            // La creación de tablas ahora se maneja estrictamente vía scripts SQL de DBA (ej. 01_StoredProcedures.sql).
            return Task.CompletedTask;
        }

        public async Task GuardarMensajeAsync(string telefono, string rol, string contenido)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.ExecuteAsync(
                "[Operacion].[usp_HistorialChat_Guardar]", 
                new { Telefono = telefono, Rol = rol, Contenido = contenido },
                commandType: System.Data.CommandType.StoredProcedure);
        }

        public async Task<List<ChatMessage>> ObtenerHistorialAsync(string telefono, int limite = 20)
        {
            using var connection = new SqlConnection(_connectionString);
            var historialASC = await connection.QueryAsync<ChatMessage>(
                "[Operacion].[usp_HistorialChat_Obtener]", 
                new { Telefono = telefono, Limite = limite },
                commandType: System.Data.CommandType.StoredProcedure);
                
            return historialASC.ToList(); // El SP ya ordena ASC
        }

        public async Task LimpiarHistorialAsync(string telefono)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.ExecuteAsync(
                "[Operacion].[usp_HistorialChat_Limpiar]", 
                new { Telefono = telefono },
                commandType: System.Data.CommandType.StoredProcedure);
        }
    }
}
