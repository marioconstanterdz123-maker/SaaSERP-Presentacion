using Microsoft.EntityFrameworkCore;
using SaaSERP.Api.Data;

namespace SaaSERP.Api.Services
{
    /// <summary>
    /// Background service que revisa cada 5 minutos si algún chat en modo silencio
    /// ha superado el tiempo de inactividad configurado por el negocio,
    /// y lo reactiva automáticamente para que la IA retome.
    /// </summary>
    public class TimeoutWorkerService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<TimeoutWorkerService> _logger;
        private static readonly TimeSpan _intervalo = TimeSpan.FromMinutes(5);

        public TimeoutWorkerService(IServiceScopeFactory scopeFactory, ILogger<TimeoutWorkerService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("[TimeoutWorker] Servicio iniciado.");
            while (!stoppingToken.IsCancellationRequested)
            {
                await ReactivarSesionesVencidasAsync();
                await Task.Delay(_intervalo, stoppingToken);
            }
        }

        private async Task ReactivarSesionesVencidasAsync()
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<SaaSContext>();

                // Traer negocios con su TiempoSilencioMinutos
                var negociosTiempos = await db.Negocios
                    .Select(n => new { n.Id, n.TiempoSilencioMinutos })
                    .ToDictionaryAsync(n => n.Id, n => n.TiempoSilencioMinutos);

                var sesionesActivas = await db.ChatSessions
                    .Where(s => s.ModoSilencio)
                    .ToListAsync();

                int reactivadas = 0;
                foreach (var sesion in sesionesActivas)
                {
                    int minutos = negociosTiempos.GetValueOrDefault(sesion.NegocioId, 60);
                    var limite = DateTime.UtcNow.AddMinutes(-minutos);
                    if (sesion.UltimoMensaje < limite)
                    {
                        sesion.ModoSilencio = false;
                        sesion.EsperandoConfirmacionHandoff = false;
                        sesion.WhisperEnviado = false;
                        reactivadas++;
                    }
                }

                if (reactivadas > 0)
                {
                    await db.SaveChangesAsync();
                    _logger.LogInformation("[TimeoutWorker] {n} sesiones reactivadas por timeout.", reactivadas);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[TimeoutWorker] Error al revisar sesiones.");
            }
        }
    }
}
