using Microsoft.EntityFrameworkCore;
using SaaSERP.Api.Data;

namespace SaaSERP.Api.Services
{
    public class RecordatoriosWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<RecordatoriosWorker> _logger;

        public RecordatoriosWorker(IServiceScopeFactory scopeFactory, ILogger<RecordatoriosWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Iniciando Worker de Recordatorios de Citas...");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcesarRecordatoriosAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error crítico en RecordatoriosWorker.");
                }

                // Escaneo silencioso cada 2 minutos
                await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);
            }
        }

        private async Task ProcesarRecordatoriosAsync(CancellationToken stoppingToken)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<SaaSContext>();
            var whatsApp = scope.ServiceProvider.GetRequiredService<WhatsAppService>();
            var negocioService = scope.ServiceProvider.GetRequiredService<INegocioService>();

            var ventanaInicio = DateTime.Now;
            var ventanaFin = DateTime.Now.AddMinutes(90); // Avisar si cae en los proximos 90 min

            var citasAVencer = await context.Citas
                .Where(c => c.Estado == "Pendiente" 
                         && c.RecordatorioEnviado == false
                         && c.FechaHoraInicio >= ventanaInicio 
                         && c.FechaHoraInicio <= ventanaFin)
                .ToListAsync(stoppingToken);

            foreach (var cita in citasAVencer)
            {
                var negocio = await negocioService.ObtenerConfiguracionPorIdAsync(cita.NegocioId);
                if (negocio == null || string.IsNullOrWhiteSpace(cita.TelefonoCliente))
                    continue;

                string instanciaWp = $"negocio_{cita.NegocioId}";
                var exito = await whatsApp.EnviarRecordatorioCitaAsync(
                    instanciaWp, 
                    cita.TelefonoCliente, 
                    cita.NombreCliente, 
                    negocio.Nombre, 
                    cita.FechaHoraInicio);

                if (exito)
                {
                    cita.RecordatorioEnviado = true;
                    _logger.LogInformation($"[WhatsApp] Recordatorio PUSH enviado exitosamente para la Cita ID {cita.Id} a las {DateTime.Now:HH:mm}.");
                }
            }

            if (citasAVencer.Any())
            {
                await context.SaveChangesAsync(stoppingToken);
            }
        }
    }
}
