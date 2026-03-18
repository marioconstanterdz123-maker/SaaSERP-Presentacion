using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaaSERP.Api.Data;
using SaaSERP.Api.Models;

namespace SaaSERP.Api.Controllers
{
    // Estas etiquetas le dicen a C# que esto es una API y configuran la URL (ej: /api/negocios)
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NegociosController : ControllerBase
    {
        private readonly SaaSContext _context;


        public NegociosController(SaaSContext context)
        {
            _context = context;
        }


        [HttpGet]
        public async Task<ActionResult<IEnumerable<Negocio>>> GetNegocios()
        {

            return await _context.Negocios.ToListAsync();
        }


        [HttpPost]
        [HttpPost]
        public async Task<ActionResult<Negocio>> PostNegocio([FromBody] Negocio negocio)
        {
            // Forzamos la fecha y reseteamos el ID por seguridad
            negocio.Id = 0;
            negocio.FechaRegistro = DateTime.UtcNow;

            _context.Negocios.Add(negocio);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetNegocios), new { id = negocio.Id }, negocio);
        }
        // Al final de tu archivo, fuera de la clase del controlador pero dentro del namespace
        public class NegocioCreateDto
        {
            public string Nombre { get; set; } = string.Empty;
            public string? TelefonoWhatsApp { get; set; }
            public bool Activo { get; set; }
            public string SistemaAsignado { get; set; } = string.Empty; // CITAS, COMANDAS, PARQUEADERO
            public int CapacidadMaxima { get; set; }
            public int DuracionMinutosCita { get; set; }
            public bool UsaMesas { get; set; }
        }
    }
}