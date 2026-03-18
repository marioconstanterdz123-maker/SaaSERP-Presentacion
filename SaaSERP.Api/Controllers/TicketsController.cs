using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaaSERP.Api.Data;
using SaaSERP.Api.Models;

namespace SaaSERP.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TicketsController : ControllerBase
    {
        private readonly SaaSContext _context;

        public TicketsController(SaaSContext context)
        {
            _context = context;
        }

        private int ObtenerNegocioIdDelToken() =>
            int.Parse(User.FindFirst("NegocioId")?.Value ?? "0");

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
                HoraEntrada = DateTime.Now,
                Estado = "Activo"
            };

            // CORRECCIÓN: Usando _context.Tickets (como está en tu SaaSContext)
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

            return Ok(new
            {
                Mensaje = "Salida exitosa",
                Placa = ticket.Placa,
                TiempoTotal = $"{estancia.Hours}h {estancia.Minutes}m",
                Cobro = ticket.MontoCalculado
            });
        }
    }

    public class TicketEntradaDto
    {
        public string Placa { get; set; } = string.Empty;
    }
}