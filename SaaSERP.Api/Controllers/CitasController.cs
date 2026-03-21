using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaaSERP.Api.Models;
using SaaSERP.Api.Data;
using SaaSERP.Api.Services;
using System;
using System.Threading.Tasks;

namespace SaaSERP.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CitasController : ControllerBase
    {
        private readonly ICitaService _citaService;
        private readonly INegocioService _negocioService;
        private readonly WhatsAppService _whatsApp;

        public CitasController(ICitaService citaService, INegocioService negocioService, WhatsAppService whatsApp)
        {
            _citaService = citaService;
            _negocioService = negocioService;
            _whatsApp = whatsApp;
        }

        public class DisponibilidadRequest
        {
            public int NegocioId { get; set; }
            public DateTime Fecha { get; set; }
            public TimeSpan Hora { get; set; }
        }

        [HttpGet("disponibilidad")]
        public async Task<IActionResult> ValidarDisponibilidad([FromQuery] int negocioId, [FromQuery] DateTime fecha, [FromQuery] TimeSpan hora)
        {
            try
            {
                // Obtenemos la configuración del negocio para saber cuánto dura la cita
                var negocio = await _negocioService.ObtenerConfiguracionPorIdAsync(negocioId);
                if (negocio == null) return NotFound(new { error = "Negocio no encontrado o inactivo." });

                DateTime fechaHoraInicio = fecha.Date.Add(hora);
                DateTime fechaHoraFin = fechaHoraInicio.AddMinutes(negocio.DuracionMinutosCita);

                bool disponible = await _citaService.ValidarDisponibilidadAsync(negocioId, fechaHoraInicio, fechaHoraFin);
                return Ok(new { disponible });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("registrar")]
        public async Task<IActionResult> RegistrarCita([FromBody] Cita cita)
        {
            try
            {
                // Aseguramos que el estado sea 'Pendiente' tal como lo pidió el usuario
                cita.Estado = "Pendiente";

                // Calculamos FechaHoraFin si no viene en el JSON (para evitar SqlDateTime overflow)
                if (cita.FechaHoraFin == DateTime.MinValue)
                {
                    cita.FechaHoraFin = cita.FechaHoraInicio.AddMinutes(cita.DuracionMinutos);
                }

                int citaId = await _citaService.RegistrarCitaAsync(cita);
                cita.Id = citaId;

                // --- Notificación WhatsApp (fire-and-forget, no bloqueamos la respuesta) ---
                _ = Task.Run(async () =>
                {
                    try
                    {
                        var negocio = await _negocioService.ObtenerConfiguracionPorIdAsync(cita.NegocioId);
                        if (negocio != null && !string.IsNullOrWhiteSpace(cita.TelefonoCliente))
                        {
                            // El nombre de la instancia WA se guarda como "instance_{negocioId}"
                            string instancia = $"negocio_{cita.NegocioId}";
                            await _whatsApp.EnviarConfirmacionCitaAsync(
                                instancia,
                                cita.TelefonoCliente,
                                cita.NombreCliente,
                                negocio.Nombre,
                                cita.ServicioNombre ?? "Cita",
                                cita.FechaHoraInicio);
                        }
                    }
                    catch { /* Silenciar errores de WA para no romper el flujo */ }
                });

                return Ok(new { success = true, cita });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("cliente")]
        public async Task<IActionResult> ObtenerCitasCliente([FromQuery] int negocioId, [FromQuery] string telefono)
        {
            try
            {
                var citas = await _citaService.ObtenerCitasPorTelefonoAsync(negocioId, telefono);
                return Ok(citas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPut("{id}/cancelar")]
        public async Task<IActionResult> CancelarCita(int id)
        {
            try
            {
                bool cancelada = await _citaService.CancelarCitaAsync(id);
                if (cancelada)
                    return Ok(new { success = true, message = "Cita cancelada con éxito." });
                else
                    return NotFound(new { error = "Cita no encontrada o ya cancelada." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class ReprogramarRequest
        {
            public DateTime NuevaFechaHoraInicio { get; set; }
            public int DuracionMinutos { get; set; }
        }

        [HttpPut("{id}/reprogramar")]
        public async Task<IActionResult> ReprogramarCita(int id, [FromBody] ReprogramarRequest request)
        {
            try
            {
                DateTime nuevaFechaFin = request.NuevaFechaHoraInicio.AddMinutes(request.DuracionMinutos);
                bool reprogramada = await _citaService.ReprogramarCitaAsync(id, request.NuevaFechaHoraInicio, nuevaFechaFin);
                
                if (reprogramada)
                    return Ok(new { success = true, message = "Cita reprogramada con éxito." });
                else
                    return NotFound(new { error = "Cita no encontrada." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("activas")]
        public async Task<IActionResult> ObtenerCitasActivas([FromServices] SaaSContext context)
        {
            try
            {
                if (!Request.Headers.TryGetValue("X-Negocio-Id", out var negocioIdHeader))
                    return BadRequest(new { Mensaje = "X-Negocio-Id requerido" });

                int negocioId = int.Parse(negocioIdHeader);

                // Excluir Completada y Cancelada de la vista activa
                var activas = await context.Citas
                    .Where(c => c.NegocioId == negocioId && c.Estado != "Completada" && c.Estado != "Cancelada")
                    .OrderByDescending(c => c.FechaHoraInicio)
                    .ToListAsync();

                return Ok(activas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("historial")]
        public async Task<IActionResult> ObtenerCitasHistorial([FromServices] SaaSContext context)
        {
            try
            {
                if (!Request.Headers.TryGetValue("X-Negocio-Id", out var negocioIdHeader))
                    return BadRequest(new { Mensaje = "X-Negocio-Id requerido" });

                int negocioId = int.Parse(negocioIdHeader);

                // Retornar solo las Citas que ya fueron terminadas
                var historial = await context.Citas
                    .Where(c => c.NegocioId == negocioId && (c.Estado == "Completada" || c.Estado == "Cancelada"))
                    .OrderByDescending(c => c.FechaHoraInicio)
                    .ToListAsync();

                return Ok(historial);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        public class EstadoCitaDto
        {
            public string NuevoEstado { get; set; } = string.Empty;
        }

        [HttpPut("{id}/estado")]
        public async Task<IActionResult> CambiarEstadoCita(int id, [FromBody] EstadoCitaDto dto, [FromServices] SaaSContext context)
        {
            if (!Request.Headers.TryGetValue("X-Negocio-Id", out var negocioIdHeader))
                return BadRequest(new { Mensaje = "X-Negocio-Id requerido" });

            int miNegocioId = int.Parse(negocioIdHeader);

            var cita = await context.Citas.FirstOrDefaultAsync(c => c.Id == id && c.NegocioId == miNegocioId);
            if (cita == null) return NotFound(new { error = "Cita no encontrada" });

            cita.Estado = dto.NuevoEstado;
            await context.SaveChangesAsync();

            return Ok(new { success = true, cita });
        }
    }
}