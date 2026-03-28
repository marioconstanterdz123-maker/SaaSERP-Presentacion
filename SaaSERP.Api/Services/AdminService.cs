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
            return await connection.QueryAsync<Negocio>(
                "SELECT * FROM [Core].[Negocios] WHERE EliminadoLogico = 0 ORDER BY Id");
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
            var id = await connection.ExecuteScalarAsync<int>(
                @"INSERT INTO [Core].[Negocios]
                    (Nombre, TelefonoWhatsApp, SistemaAsignado, CapacidadMaxima,
                     DuracionMinutosCita, UsaMesas, HoraApertura, HoraCierre,
                     FechaVencimientoSuscripcion)
                  OUTPUT INSERTED.Id
                  VALUES
                    (@Nombre, @TelefonoWhatsApp, @SistemaAsignado, @CapacidadMaxima,
                     @DuracionMinutosCita, @UsaMesas, @HoraApertura, @HoraCierre,
                     DATEADD(DAY, 30, GETUTCDATE()))",
                new {
                    negocio.Nombre, negocio.TelefonoWhatsApp, negocio.SistemaAsignado,
                    negocio.CapacidadMaxima, negocio.DuracionMinutosCita,
                    negocio.UsaMesas, negocio.HoraApertura, negocio.HoraCierre
                });
            return id;
        }

        public async Task<bool> ActualizarNegocioAsync(Negocio n)
        {
            using var connection = new SqlConnection(_connectionString);
            var rows = await connection.ExecuteAsync(
                @"UPDATE [Core].[Negocios] SET
                    Nombre                 = @Nombre,
                    TelefonoWhatsApp       = @TelefonoWhatsApp,
                    SistemaAsignado        = @SistemaAsignado,
                    CapacidadMaxima        = @CapacidadMaxima,
                    DuracionMinutosCita    = @DuracionMinutosCita,
                    UsaMesas               = @UsaMesas,
                    HoraApertura           = @HoraApertura,
                    HoraCierre             = @HoraCierre,
                    Activo                 = @Activo,
                    AccesoWeb              = @AccesoWeb,
                    AccesoMovil            = @AccesoMovil,
                    ModuloHistorial        = @ModuloHistorial,
                    ModuloWhatsApp         = @ModuloWhatsApp,
                    ModuloWhatsAppIA       = @ModuloWhatsAppIA,
                    ModuloCRM              = @ModuloCRM,
                    ModuloReportes         = @ModuloReportes,
                    MercadoPagoAccessToken = @MercadoPagoAccessToken,
                    TiempoSilencioMinutos  = @TiempoSilencioMinutos
                  WHERE Id = @Id",
                new {
                    n.Nombre, n.TelefonoWhatsApp, n.SistemaAsignado,
                    n.CapacidadMaxima, n.DuracionMinutosCita, n.UsaMesas,
                    n.HoraApertura, n.HoraCierre, n.Activo,
                    n.AccesoWeb, n.AccesoMovil, n.ModuloHistorial,
                    n.ModuloWhatsApp, n.ModuloWhatsAppIA, n.ModuloCRM,
                    n.ModuloReportes, n.MercadoPagoAccessToken,
                    n.TiempoSilencioMinutos, n.Id
                });
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

        public async Task RenovarSuscripcionAsync(int id, int dias)
        {
            using var connection = new SqlConnection(_connectionString);
            // Si ya venció: inicia desde hoy. Si aún está vigente: extiende desde la fecha actual de vencimiento.
            await connection.ExecuteAsync(
                @"UPDATE [Core].[Negocios]
                  SET FechaVencimientoSuscripcion = 
                        CASE WHEN FechaVencimientoSuscripcion < GETUTCDATE()
                             THEN DATEADD(DAY, @Dias, GETUTCDATE())
                             ELSE DATEADD(DAY, @Dias, FechaVencimientoSuscripcion)
                        END,
                      AccesoWeb = 1,
                      Activo    = 1
                  WHERE Id = @Id",
                new { Id = id, Dias = dias });
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
