using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaaSERP.Api.Data;
using SaaSERP.Api.Models;

namespace SaaSERP.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ClientesCRMController : ControllerBase
    {
        private readonly SaaSContext _context;

        public ClientesCRMController(SaaSContext context) => _context = context;

        // GET /api/ClientesCRM/negocio/{negocioId}
        [HttpGet("negocio/{negocioId}")]
        public async Task<IActionResult> Listar(int negocioId)
        {
            var clientes = await _context.ClientesCRM
                .Where(c => c.NegocioId == negocioId)
                .OrderByDescending(c => c.UltimaInteraccion)
                .ToListAsync();
            return Ok(clientes);
        }

        // GET /api/ClientesCRM/negocio/{negocioId}/cliente/{telefono}
        [HttpGet("negocio/{negocioId}/cliente/{telefono}")]
        public async Task<IActionResult> ObtenerPorTelefono(int negocioId, string telefono)
        {
            var cliente = await _context.ClientesCRM
                .FirstOrDefaultAsync(c => c.NegocioId == negocioId && c.Telefono == telefono);

            if (cliente == null) return NotFound();

            // Incluir historial de citas
            var citas = await _context.Citas
                .Where(c => c.NegocioId == negocioId && c.TelefonoCliente == telefono)
                .OrderByDescending(c => c.FechaHoraInicio)
                .Select(c => new { c.Id, c.FechaHoraInicio, c.Estado, c.TrabajadorId })
                .ToListAsync();

            return Ok(new { cliente, citas });
        }

        // POST /api/ClientesCRM  — Registro manual
        [HttpPost]
        [Authorize(Roles = "SuperAdmin,AdminNegocio")]
        public async Task<IActionResult> RegistrarManual([FromBody] ClienteCRMDto dto)
        {
            var existente = await _context.ClientesCRM
                .FirstOrDefaultAsync(c => c.NegocioId == dto.NegocioId && c.Telefono == dto.Telefono);

            if (existente != null)
                return Conflict(new { error = "El cliente ya existe.", cliente = existente });

            var cliente = new ClienteCRM
            {
                NegocioId = dto.NegocioId,
                Telefono = dto.Telefono,
                NombreDetectado = dto.Nombre,
                PrimerContacto = DateTime.UtcNow,
                UltimaInteraccion = DateTime.UtcNow
            };
            _context.ClientesCRM.Add(cliente);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(ObtenerPorTelefono),
                new { negocioId = dto.NegocioId, telefono = dto.Telefono }, cliente);
        }
    }

    public class ClienteCRMDto
    {
        public int NegocioId { get; set; }
        public string Telefono { get; set; } = string.Empty;
        public string? Nombre { get; set; }
    }
}
