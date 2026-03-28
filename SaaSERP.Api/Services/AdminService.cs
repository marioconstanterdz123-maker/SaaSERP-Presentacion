using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using SaaSERP.Api.Models;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

namespace SaaSERP.Api.Services
{
    public class AdminService : IAdminService
    {
        private readonly string _connectionString;

        public AdminService(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") 
                ?? throw new System.ArgumentNullException("DefaultConnection");
        }

        // ======================== NEGOCIOS ========================
        public async Task<IEnumerable<Negocio>> ObtenerTodosNegociosAsync()
        {
            using var connection = new SqlConnection(_connectionString);
            // SP pero filtrando eliminados lógicos en caso que el SP no lo haga
            var todos = await connection.QueryAsync<Negocio>(
                "[Core].[usp_Negocios_ObtenerTodos]",
                commandType: CommandType.StoredProcedure);
            return todos.Where(n => !n.EliminadoLogico);
        }

        public async Task<Negocio?> ObtenerNegocioPorIdAsync(int id)
        {
            using var connection = new SqlConnection(_connectionString);
            return await connection.QueryFirstOrDefaultAsync<Negocio>(
                "SELECT * FROM [Core].[Negocios] WHERE Id = @Id",
                new { Id = id });
        }

        public async Task<int> CrearNegocioAsync(Negocio negocio)
        {
            using var connection = new SqlConnection(_connectionString);
            var parameters = new DynamicParameters();
            parameters.Add("@Nombre", negocio.Nombre);
            parameters.Add("@TelefonoWhatsApp", negocio.TelefonoWhatsApp);
            parameters.Add("@SistemaAsignado", negocio.SistemaAsignado);
            parameters.Add("@CapacidadMaxima", negocio.CapacidadMaxima);
            parameters.Add("@DuracionMinutosCita", negocio.DuracionMinutosCita);
            parameters.Add("@UsaMesas", negocio.UsaMesas);
            parameters.Add("@HoraApertura", negocio.HoraApertura);
            parameters.Add("@HoraCierre", negocio.HoraCierre);

            return await connection.ExecuteScalarAsync<int>(
                "[Core].[usp_Negocios_Crear]",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> ActualizarNegocioAsync(Negocio n)
        {
            using var connection = new SqlConnection(_connectionString);
            var parameters = new DynamicParameters();
            parameters.Add("@Id", n.Id);
            parameters.Add("@Nombre", n.Nombre);
            parameters.Add("@TelefonoWhatsApp", n.TelefonoWhatsApp);
            parameters.Add("@SistemaAsignado", n.SistemaAsignado);
            parameters.Add("@CapacidadMaxima", n.CapacidadMaxima);
            parameters.Add("@DuracionMinutosCita", n.DuracionMinutosCita);
            parameters.Add("@UsaMesas", n.UsaMesas);
            parameters.Add("@HoraApertura", n.HoraApertura);
            parameters.Add("@HoraCierre", n.HoraCierre);
            parameters.Add("@Activo", n.Activo);
            parameters.Add("@AccesoWeb", n.AccesoWeb);
            parameters.Add("@AccesoMovil", n.AccesoMovil);
            parameters.Add("@ModuloHistorial", n.ModuloHistorial);
            parameters.Add("@ModuloWhatsApp", n.ModuloWhatsApp);
            parameters.Add("@ModuloReportes", n.ModuloReportes);
            parameters.Add("@MercadoPagoAccessToken", n.MercadoPagoAccessToken);

            var rows = await connection.ExecuteScalarAsync<int>(
                "[Core].[usp_Negocios_Actualizar]",
                parameters,
                commandType: CommandType.StoredProcedure);

            // Los campos nuevos no están en el SP — los actualizamos con UPDATE directo
            await connection.ExecuteAsync(
                @"UPDATE [Core].[Negocios] 
                  SET ModuloWhatsAppIA      = @ModuloWhatsAppIA,
                      ModuloCRM             = @ModuloCRM,
                      TiempoSilencioMinutos = @TiempoSilencioMinutos
                  WHERE Id = @Id",
                new { n.ModuloWhatsAppIA, n.ModuloCRM, n.TiempoSilencioMinutos, n.Id });

            return rows > 0;
        }

        public async Task EliminarLogicoAsync(int id)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.ExecuteAsync(
                "UPDATE [Core].[Negocios] SET EliminadoLogico=1, FechaEliminacion=GETUTCDATE(), Activo=0 WHERE Id=@Id",
                new { Id = id });
        }

        public async Task<IEnumerable<Negocio>> ObtenerPapeleraAsync()
        {
            using var connection = new SqlConnection(_connectionString);
            return await connection.QueryAsync<Negocio>(
                "SELECT * FROM [Core].[Negocios] WHERE EliminadoLogico=1 ORDER BY FechaEliminacion DESC");
        }

        public async Task RestaurarAsync(int id)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.ExecuteAsync(
                "UPDATE [Core].[Negocios] SET EliminadoLogico=0, FechaEliminacion=NULL, Activo=1 WHERE Id=@Id",
                new { Id = id });
        }

        public async Task EliminarDefinitivoAsync(int id)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.ExecuteAsync(
                "DELETE FROM [Core].[Negocios] WHERE Id=@Id AND EliminadoLogico=1",
                new { Id = id });
        }


        // ======================== SERVICIOS ========================
        public async Task<IEnumerable<Servicio>> ObtenerServiciosAdminAsync(int negocioId)
        {
            using var connection = new SqlConnection(_connectionString);
            return await connection.QueryAsync<Servicio>(
                "[Core].[usp_Servicios_ObtenerPorNegocio]", 
                new { NegocioId = negocioId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<int> CrearServicioAsync(Servicio s)
        {
            using var connection = new SqlConnection(_connectionString);
            return await connection.ExecuteScalarAsync<int>(
                "[Core].[usp_Servicios_Crear]",
                new { s.NegocioId, s.Nombre, s.DuracionMinutos, s.Precio },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> ActualizarServicioAsync(Servicio s)
        {
            using var connection = new SqlConnection(_connectionString);
            var rows = await connection.ExecuteScalarAsync<int>(
                "[Core].[usp_Servicios_Actualizar]",
                new { s.Id, s.NegocioId, s.Nombre, s.DuracionMinutos, s.Precio, s.Activo },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        // ======================== RECURSOS ========================
        public async Task<IEnumerable<Recurso>> ObtenerRecursosAdminAsync(int negocioId)
        {
            using var connection = new SqlConnection(_connectionString);
            return await connection.QueryAsync<Recurso>(
                "[Core].[usp_Recursos_ObtenerPorNegocio]", 
                new { NegocioId = negocioId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<int> CrearRecursoAsync(Recurso r)
        {
            using var connection = new SqlConnection(_connectionString);
            return await connection.ExecuteScalarAsync<int>(
                "[Core].[usp_Recursos_Crear]",
                new { r.NegocioId, r.Nombre, r.Tipo },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> ActualizarRecursoAsync(Recurso r)
        {
            using var connection = new SqlConnection(_connectionString);
            var rows = await connection.ExecuteScalarAsync<int>(
                "[Core].[usp_Recursos_Actualizar]",
                new { r.Id, r.NegocioId, r.Nombre, r.Tipo, r.Activo },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }
    }
}
