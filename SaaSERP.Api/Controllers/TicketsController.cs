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
    // [Authorize] // Temporalmente removido para probar front sin JWT
    public class TicketsController : ControllerBase
    {
        private readonly SaaSContext _context;
        private readonly WhatsAppService _whatsApp;

        public TicketsController(SaaSContext context, WhatsAppService whatsApp)
        {
            _context = context;
            _whatsApp = whatsApp;
        }

        private int ObtenerNegocioIdDelToken()
        {
            if (Request.Headers.TryGetValue("X-Negocio-Id", out var val))
                return int.Parse(val);
            return int.Parse(User.FindFirst("NegocioId")?.Value ?? "0");
        }

        // ==========================================
        // 1. ENTRADA DE VEHÍCULO
        // ==========================================
        [HttpPost("entrada")]
        public async Task<ActionResult<TicketParqueadero>> EntradaVehiculo([FromBody] TicketEntradaDto dto)
        {
            var nuevaEntrada = new TicketParqueadero
            {
                NegocioId = ObtenerNegocioIdDelToken(),
                Placa = dto.Placa,
                TelefonoContacto = dto.TelefonoContacto,
                HoraEntrada = DateTime.Now,
                Estado = "Activo"
            };

            _context.Tickets.Add(nuevaEntrada);
            await _context.SaveChangesAsync();
            return Ok(nuevaEntrada);
        }

        // ==========================================
        // 2. SALIDA Y CÁLCULO DE MONTO
        // ==========================================
        [HttpPut("{id}/salida")]
        public async Task<IActionResult> SalidaVehiculo(int id)
        {
            int miNegocioId = ObtenerNegocioIdDelToken();

            // CORRECCIÓN: Usando _context.Tickets
            var ticket = await _context.Tickets
                .FirstOrDefaultAsync(t => t.Id == id && t.NegocioId == miNegocioId);

            if (ticket == null || ticket.Estado == "Cerrado")
                return NotFound(new { Mensaje = "Ticket no encontrado o ya procesado" });

            ticket.HoraSalida = DateTime.Now;
            ticket.Estado = "Cerrado";

            // Lógica de Cobro ($20 por hora)
            double tarifaPorHora = 20.0;
            TimeSpan estancia = ticket.HoraSalida.Value - ticket.HoraEntrada;
            double horasACobrar = Math.Ceiling(estancia.TotalHours);
            if (horasACobrar <= 0) horasACobrar = 1;

            ticket.MontoCalculado = (decimal)(horasACobrar * tarifaPorHora);

            await _context.SaveChangesAsync();

            // --- Notificación WhatsApp (fire-and-forget) ---
            _ = Task.Run(async () =>
            {
                try
                {
                    if (!string.IsNullOrWhiteSpace(ticket.TelefonoContacto))
                    {
                        var negocio = await _context.Negocios.FindAsync(ticket.NegocioId);
                        string instancia = $"negocio_{ticket.NegocioId}";
                        await _whatsApp.EnviarReciboParkingAsync(
                            instancia,
                            ticket.TelefonoContacto,
                            ticket.Placa,
                            negocio?.Nombre ?? "Estacionamiento",
                            ticket.HoraEntrada,
                            ticket.HoraSalida!.Value,
                            ticket.MontoCalculado ?? 0);
                    }
                }
                catch { /* Silenciar errores WA */ }
            });

            return Ok(new
            {
                Mensaje = "Salida exitosa",
                Placa = ticket.Placa,
                TiempoTotal = $"{estancia.Hours}h {estancia.Minutes}m",
                Cobro = ticket.MontoCalculado
            });
        }

        // ==========================================
        // 3. OBTENER VEHÍCULOS ADENTRO
        // ==========================================
        [HttpGet("activas")]
        public async Task<ActionResult<IEnumerable<TicketParqueadero>>> GetActivas()
        {
            int miNegocioId = ObtenerNegocioIdDelToken();
            var parqueados = await _context.Tickets
                .Where(t => t.NegocioId == miNegocioId && t.Estado == "Activo")
                .OrderByDescending(t => t.HoraEntrada)
                .ToListAsync();
            return Ok(parqueados);
        }

        [HttpGet("historial")]
        public async Task<ActionResult<IEnumerable<TicketParqueadero>>> GetHistorial()
        {
            int miNegocioId = ObtenerNegocioIdDelToken();
            var historial = await _context.Tickets
                .Where(t => t.NegocioId == miNegocioId && t.Estado == "Cerrado")
                .OrderByDescending(t => t.HoraEntrada)
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