using Microsoft.Data.SqlClient;
using Dapper;

namespace SaaSERP.Api.Services
{
    /// <summary>
    /// Worker que corre cada 24h y desactiva automáticamente los negocios
    /// cuya suscripción ha vencido (FechaVencimientoSuscripcion &lt; GETUTCDATE()).
    /// </summary>
    public class SuscripcionWorker : BackgroundService
    {
        private readonly ILogger<SuscripcionWorker> _logger;
        private readonly string _connectionString;

        public SuscripcionWorker(ILogger<SuscripcionWorker> logger, IConfiguration configuration)
        {
            _logger = logger;
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new ArgumentNullException("DefaultConnection");
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("SuscripcionWorker iniciado.");

            // Verificar al arrancar y luego cada 24 horas
            while (!stoppingToken.IsCancellationRequested)
            {
                await VerificarSuscripcionesAsync();
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }

        private async Task VerificarSuscripcionesAsync()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                var afectados = await connection.ExecuteAsync(
                    @"UPDATE [Core].[Negocios]
                      SET AccesoWeb = 0,
                          Activo    = 0
                      WHERE FechaVencimientoSuscripcion < GETUTCDATE()
                        AND EliminadoLogico = 0
                        AND AccesoWeb       = 1");

                if (afectados > 0)
                    _logger.LogWarning("SuscripcionWorker: {Count} negocio(s) desactivados por vencimiento de suscripción.", afectados);
                else
                    _logger.LogInformation("SuscripcionWorker: sin vencimientos hoy.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SuscripcionWorker: error al verificar suscripciones.");
            }
        }
    }
}
