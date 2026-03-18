using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaaSERP.Api.Data;
using SaaSERP.Api.Models;

namespace SaaSERP.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Candado puesto
    public class ComandasController : ControllerBase
    {
        private readonly SaaSContext _context;

        public ComandasController(SaaSContext context)
        {
            _context = context;
        }

        // ==========================================
        // LEER EL ID DEL NEGOCIO DESDE EL TOKEN
        // ==========================================
        private int ObtenerNegocioIdDelToken()
        {
            var negocioIdClaim = User.FindFirst("NegocioId")?.Value;
            return int.Parse(negocioIdClaim ?? "0");
        }

        // ==========================================
        // 1. OBTENER COMANDAS ACTIVAS
        // ==========================================
        [HttpGet("activas")]
        public async Task<ActionResult<IEnumerable<Comanda>>> GetComandasActivas()
        {
            int miNegocioId = ObtenerNegocioIdDelToken();

            // Traemos las comandas del negocio que NO estén cobradas
            var comandas = await _context.Comandas
                                         .Where(c => c.NegocioId == miNegocioId && c.Estado != "Cobrada")
                                         .OrderBy(c => c.FechaCreacion)
                                         .ToListAsync();

            return Ok(comandas);
        }

        // ==========================================
        // 2. CREAR UNA NUEVA COMANDA
        // ==========================================
        [HttpPost]
        public async Task<ActionResult<Comanda>> PostComanda(ComandaCreateDto dto)
        {
            int miNegocioId = ObtenerNegocioIdDelToken();

            var nuevaComanda = new Comanda
            {
                NegocioId = miNegocioId,
                // AQUÍ ESTÁ LA CORRECCIÓN EXACTA A TU MODELO:
                IdentificadorAtencion = dto.IdentificadorAtencion,
                ResumenPedido = dto.ResumenPedido,
                Total = dto.Total,
                Estado = "Recibida" // Ajustado al valor por defecto de tu modelo
                // Nota: FechaCreacion ya no la mandamos porque tu modelo tiene '= DateTime.UtcNow' por defecto. ¡Excelente práctica!
            };

            _context.Comandas.Add(nuevaComanda);
            await _context.SaveChangesAsync();

            return Ok(nuevaComanda);
        }

        // ==========================================
        // 3. ACTUALIZAR ESTADO DE LA COMANDA
        // ==========================================
        [HttpPut("{id}/estado")]
        public async Task<IActionResult> ActualizarEstado(int id, [FromBody] EstadoUpdateDto dto)
        {
            int miNegocioId = ObtenerNegocioIdDelToken();

            var comanda = await _context.Comandas
                                        .FirstOrDefaultAsync(c => c.Id == id && c.NegocioId == miNegocioId);

            if (comanda == null)
                return NotFound(new { Mensaje = "Comanda no encontrada" });

            comanda.Estado = dto.NuevoEstado;
            await _context.SaveChangesAsync();

            return Ok(new { Mensaje = $"Actualizada a: {dto.NuevoEstado}", Comanda = comanda });
        }

        // Agregamos este mini DTO al final del archivo
        public class EstadoUpdateDto
        {
            public string NuevoEstado { get; set; } = string.Empty;
        }
    }

    // ==========================================
    // DTO: Lo que manda la App o n8n
    // ==========================================
    public class ComandaCreateDto
    {
        // CORREGIDO PARA QUE HAGA MATCH CON TU MODELO
        public string IdentificadorAtencion { get; set; } = string.Empty;
        public string ResumenPedido { get; set; } = string.Empty;
        public decimal Total { get; set; }
    }
}