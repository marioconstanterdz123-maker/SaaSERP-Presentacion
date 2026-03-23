using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaaSERP.Api.Data;
using SaaSERP.Api.Models;
using SaaSERP.Api.Services;

namespace SaaSERP.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TicketsController : ControllerBase
    {
        private readonly SaaSContext _context;
        private readonly WhatsAppService _whatsApp;
        private readonly IEstadiaService _estadiaService;
        private readonly INegocioService _negocioService;

        public TicketsController(SaaSContext context, WhatsAppService whatsApp, IEstadiaService estadiaService, INegocioService negocioService)
        {
            _context = context;
            _whatsApp = whatsApp;
            _estadiaService = estadiaService;
            _negocioService = negocioService;
        }

        private int ObtenerNegocioId()
        {
            if (Request.Headers.TryGetValue("X-Negocio-Id", out var val) && int.TryParse(val, out var id))
                return id;
            var claim = User.FindFirst("NegocioId")?.Value;
            return int.TryParse(claim, out var claimId) ? claimId : 0;
        }

        // ==========================================
        // 1. ENTRADA DE VEHÍCULO
        // ==========================================
        [HttpPost("entrada")]
        public async Task<IActionResult> EntradaVehiculo([FromBody] TicketEntradaDto dto)
        {
            int negocioId = ObtenerNegocioId();
            if (negocioId == 0) return BadRequest(new { error = "No se pudo determinar el negocio." });

            // Usamos el SP que valida duplicados (retorna -1 si ya está adentro)
            int estadiaId = await _estadiaService.RegistrarEntradaAsync(negocioId, dto.Placa.Trim().ToUpper());

            if (estadiaId == -1)
                return Conflict(new { error = $"El vehículo {dto.Placa.ToUpper()} ya figura como 'En Curso' en este estacionamiento." });

            // También guardamos en Tickets para compatibilidad con el frontend existente
            var ticket = new TicketParqueadero
            {
                NegocioId = negocioId,
                Placa = dto.Placa.Trim().ToUpper(),
                TelefonoContacto = dto.TelefonoContacto,
                HoraEntrada = DateTime.Now,
                Estado = "Activo"
            };
            _context.Tickets.Add(ticket);
            await _context.SaveChangesAsync();

            return Ok(new { estadiaId, ticketId = ticket.Id, placa = ticket.Placa });
        }

        // ==========================================
        // 2. CALCULAR COBRO (preview sin cerrar)
        // ==========================================
        [HttpGet("{placa}/calcular")]
        public async Task<IActionResult> CalcularCobro(string placa)
        {
            int negocioId = ObtenerNegocioId();
            var resultado = await _estadiaService.CalcularCobroAsync(negocioId, placa.ToUpper(), soloCalcular: true);

            if (resultado.EstadiaId == -1)
                return NotFound(new { error = "No se encontró estadía activa para esa placa." });

            return Ok(new
            {
                estadiaId      = resultado.EstadiaId,
                montoTotal     = resultado.MontoTotal,
                minutos        = resultado.MinutosTranscurridos,
                horas          = (resultado.MinutosTranscurridos / 60),
                minutosExtra   = (resultado.MinutosTranscurridos % 60),
                detalle        = resultado.Detalle
            });
        }

        // ==========================================
        // 3. SALIDA Y CIERRE (usando SP con tarifa configurable)
        // ==========================================
        [HttpPut("{id}/salida")]
        public async Task<IActionResult> SalidaVehiculo(int id)
        {
            int negocioId = ObtenerNegocioId();

            var ticket = await _context.Tickets
                .FirstOrDefaultAsync(t => t.Id == id && t.NegocioId == negocioId);

            if (ticket == null || ticket.Estado == "Cerrado")
                return NotFound(new { error = "Ticket no encontrado o ya procesado." });

            // Calcular cobro: SP primero; fallback por tiempo si no existe en Operacion.Estadias (ticket antiguo)
            decimal montoFinal = 0;
            int minutosTotal = 0;
            try
            {
                var resultado = await _estadiaService.CalcularCobroAsync(negocioId, ticket.Placa, soloCalcular: false);
                if (resultado.EstadiaId != -1)
                {
                    montoFinal = resultado.MontoTotal;
                    minutosTotal = resultado.MinutosTranscurridos;
                }
                else
                {
                    // Ticket antiguo: solo está en Tickets, no en Operacion.Estadias — fallback simple
                    TimeSpan t = DateTime.Now - ticket.HoraEntrada;
                    montoFinal = (decimal)(Math.Max(Math.Ceiling(t.TotalHours), 1) * 20.0);
                    minutosTotal = (int)t.TotalMinutes;
                }
            }
            catch
            {
                TimeSpan t = DateTime.Now - ticket.HoraEntrada;
                montoFinal = (decimal)(Math.Max(Math.Ceiling(t.TotalHours), 1) * 20.0);
                minutosTotal = (int)t.TotalMinutes;
            }

            ticket.HoraSalida = DateTime.Now;
            ticket.Estado = "Cerrado";
            ticket.MontoCalculado = montoFinal;
            await _context.SaveChangesAsync();

            TimeSpan estancia = ticket.HoraSalida.Value - ticket.HoraEntrada;

            // Fire-and-forget: Notificar al cliente (si dejó teléfono)
            _ = Task.Run(async () =>
            {
                try
                {
                    var negocio = await _context.Negocios.FindAsync(negocioId);
                    string instancia = $"negocio_{negocioId}";

                    if (!string.IsNullOrWhiteSpace(ticket.TelefonoContacto))
                    {
                        await _whatsApp.EnviarReciboParkingAsync(
                            instancia,
                            ticket.TelefonoContacto,
                            ticket.Placa,
                            negocio?.Nombre ?? "Estacionamiento",
                            ticket.HoraEntrada,
                            ticket.HoraSalida!.Value,
                            ticket.MontoCalculado ?? 0);
                    }

                    // Owner Routing: notificar al dueño según si tiene Web o no
                    if (negocio != null && !string.IsNullOrWhiteSpace(negocio.TelefonoWhatsApp))
                    {
                        await _whatsApp.NotificarOwnerParqueaderoAsync(
                            instancia,
                            negocio.TelefonoWhatsApp,
                            negocio.AccesoWeb,
                            ticket.Placa,
                            "Salida",
                            ticket.MontoCalculado ?? 0);
                    }
                }
                catch { /* Silenciar errores WA */ }
            });

            return Ok(new
            {
                mensaje     = "Salida registrada exitosamente.",
                placa       = ticket.Placa,
                tiempoTotal = $"{estancia.Hours}h {estancia.Minutes}m",
                minutos     = minutosTotal,
                cobro       = ticket.MontoCalculado,
            });
        }

        // ==========================================
        // 4. VEHÍCULOS ADENTRO (activos)
        // ==========================================
        [HttpGet("activas")]
        public async Task<IActionResult> GetActivas()
        {
            int negocioId = ObtenerNegocioId();
            var parqueados = await _context.Tickets
                .Where(t => t.NegocioId == negocioId && t.Estado == "Activo")
                .OrderByDescending(t => t.HoraEntrada)
                .Select(t => new {
                    t.Id,
                    placa        = t.Placa,
                    horaEntrada  = t.HoraEntrada,
                    telefono     = t.TelefonoContacto
                })
                .ToListAsync();
            return Ok(parqueados);
        }

        // ==========================================
        // 5. HISTORIAL DEL DÍA
        // ==========================================
        [HttpGet("historial")]
        public async Task<IActionResult> GetHistorial()
        {
            int negocioId = ObtenerNegocioId();
            var hoy = DateTime.Today;
            var historial = await _context.Tickets
                .Where(t => t.NegocioId == negocioId && t.Estado == "Cerrado" && t.HoraEntrada >= hoy)
                .OrderByDescending(t => t.HoraSalida)
                .Select(t => new {
                    t.Id,
                    placa       = t.Placa,
                    horaEntrada = t.HoraEntrada,
                    horaSalida  = t.HoraSalida,
                    monto       = t.MontoCalculado,
                })
                .ToListAsync();
            return Ok(historial);
        }
    }

    public class TicketEntradaDto
    {
        public string Placa { get; set; } = string.Empty;
        /// <summary>Teléfono del dueño del vehículo para recibir el recibo por WhatsApp (opcional)</summary>
        public string? TelefonoContacto { get; set; }
    }
}