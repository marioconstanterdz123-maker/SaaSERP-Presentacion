using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using SaaSERP.Api.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SaaSERP.Api.Services
{
    public class CitaService : ICitaService
    {
        private readonly string _connectionString;

        public CitaService(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") ?? throw new System.ArgumentNullException("DefaultConnection");
        }

        public async Task<bool> ValidarDisponibilidadAsync(int negocioId, DateTime fechaHoraInicio, DateTime fechaHoraFin, int? recursoId = null)
        {
            using var connection = new SqlConnection(_connectionString);
            var result = await connection.ExecuteScalarAsync<int>(
                "[Operacion].[usp_Citas_ValidarDisponibilidad]", 
                new { NegocioId = negocioId, FechaHoraInicio = fechaHoraInicio, FechaHoraFin = fechaHoraFin, RecursoId = recursoId },
                commandType: System.Data.CommandType.StoredProcedure);
            return result == 1;
        }

        public async Task<int> RegistrarCitaAsync(Cita cita)
        {
            using var connection = new SqlConnection(_connectionString);
            return await connection.ExecuteScalarAsync<int>(
                "[Operacion].[usp_Citas_Registrar]", 
                new 
                { 
                    NegocioId = cita.NegocioId, 
                    TelefonoCliente = cita.TelefonoCliente ?? "", 
                    NombreCliente = cita.NombreCliente ?? "", 
                    FechaHoraInicio = cita.FechaHoraInicio, 
                    FechaHoraFin = cita.FechaHoraFin, 
                    Estado = cita.Estado ?? "Pendiente",
                    ServicioId = cita.ServicioId,
                    RecursoId = cita.RecursoId
                },
                commandType: System.Data.CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<Cita>> ObtenerCitasPorTelefonoAsync(int negocioId, string telefonoCliente)
        {
            using var connection = new SqlConnection(_connectionString);
            return await connection.QueryAsync<Cita>(
                "[Operacion].[usp_Citas_ObtenerPorTelefono]", 
                new { NegocioId = negocioId, TelefonoCliente = telefonoCliente },
                commandType: System.Data.CommandType.StoredProcedure);
        }

        public async Task<bool> CancelarCitaAsync(int citaId)
        {
            using var connection = new SqlConnection(_connectionString);
            int filasAfectadas = await connection.ExecuteScalarAsync<int>(
                "[Operacion].[usp_Citas_Cancelar]", 
                new { CitaId = citaId },
                commandType: System.Data.CommandType.StoredProcedure);
                
            return filasAfectadas > 0;
        }

        public async Task<bool> ReprogramarCitaAsync(int citaId, DateTime nuevaFechaInicio, DateTime nuevaFechaFin)
        {
            using var connection = new SqlConnection(_connectionString);
            int filasAfectadas = await connection.ExecuteScalarAsync<int>(
                "[Operacion].[usp_Citas_Reprogramar]", 
                new { CitaId = citaId, NuevaFechaInicio = nuevaFechaInicio, NuevaFechaFin = nuevaFechaFin },
                commandType: System.Data.CommandType.StoredProcedure);
                
            return filasAfectadas > 0;
        }
    }
}
