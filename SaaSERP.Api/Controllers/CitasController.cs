using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaaSERP.Api.Data;
using SaaSERP.Api.Models;

namespace SaaSERP.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // ¡Cerrado con llave!
    public class CitasController : ControllerBase
    {
        private readonly SaaSContext _context;

        public CitasController(SaaSContext context)
        {
            _context = context;
        }

        // ==========================================
        // TRUCO MAESTRO: LEER EL ID DEL NEGOCIO DESDE EL TOKEN
        // ==========================================
        private int ObtenerNegocioIdDelToken()
        {
            var negocioIdClaim = User.FindFirst("NegocioId")?.Value;
            return int.Parse(negocioIdClaim ?? "0");
        }

        // ==========================================
        // 1. OBTENER AGENDA (SÓLO LAS CITAS DE ESTE NEGOCIO)
        // ==========================================
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Cita>>> GetCitas()
        {
            int miNegocioId = ObtenerNegocioIdDelToken();

            var misCitas = await _context.Citas
                                         .Where(c => c.NegocioId == miNegocioId)
                                         .OrderBy(c => c.FechaHoraInicio)
                                         .ToListAsync();

            return Ok(misCitas);
        }

        // ==========================================
        // 2. AGENDAR UNA NUEVA CITA
        // ==========================================
        [HttpPost]
        public async Task<ActionResult<Cita>> PostCita(CitaCreateDto dto)
        {
            int miNegocioId = ObtenerNegocioIdDelToken();

            var nuevaCita = new Cita
            {
                NegocioId = miNegocioId,
                NombreCliente = dto.NombreCliente,
                TelefonoCliente = dto.TelefonoCliente,
                FechaHoraInicio = dto.FechaHoraInicio,
                // Calculamos automáticamente la FechaHoraFin sumando los minutos
                FechaHoraFin = dto.FechaHoraInicio.AddMinutes(dto.DuracionMinutos),
                Estado = "Confirmada" // Tu valor por defecto
            };

            _context.Citas.Add(nuevaCita);
            await _context.SaveChangesAsync();

            return Ok(nuevaCita);
        }
    }

    // ==========================================
    // DTO: Exactamente lo que le pediremos al cliente o IA
    // ==========================================
    public class CitaCreateDto
    {
        public string NombreCliente { get; set; } = string.Empty;
        public string TelefonoCliente { get; set; } = string.Empty;
        public DateTime FechaHoraInicio { get; set; }
        public int DuracionMinutos { get; set; } = 60; // Asumimos 1 hora por defecto
    }
}