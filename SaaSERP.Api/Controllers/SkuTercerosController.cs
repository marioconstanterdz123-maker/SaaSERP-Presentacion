using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaaSERP.Api.Data;
using SaaSERP.Api.Models;

namespace SaaSERP.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class SkuTercerosController : ControllerBase
    {
        private readonly SaaSContext _context;

        public SkuTercerosController(SaaSContext context)
        {
            _context = context;
        }

        private int GetNegocioId()
        {
            if (Request.Headers.TryGetValue("NegocioId", out var headerValue) && int.TryParse(headerValue, out int negocioId))
            {
                return negocioId;
            }
            throw new UnauthorizedAccessException("NegocioId no proporcionado en el header.");
        }

        [HttpGet]
        public async Task<IActionResult> GetSkuTerceros([FromQuery] string? plataforma)
        {
            try
            {
                int negocioId = GetNegocioId();
                var query = _context.SkuTerceros
                    .Include(s => s.Servicio)
                    .Where(s => s.NegocioId == negocioId);

                if (!string.IsNullOrEmpty(plataforma))
                {
                    query = query.Where(s => s.Plataforma == plataforma);
                }

                var list = await query.Select(s => new
                {
                    s.Id,
                    s.Plataforma,
                    s.SkuExterno,
                    s.ServicioId,
                    ServicioNombre = s.Servicio != null ? s.Servicio.Nombre : "Servicio Desconocido"
                }).ToListAsync();

                return Ok(list);
            }
            catch (Exception ex)
            {
                return BadRequest(new { msg = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> AddSkuTercero([FromBody] SkuTercero sku)
        {
            try
            {
                int negocioId = GetNegocioId();
                sku.NegocioId = negocioId;

                var existing = await _context.SkuTerceros
                    .FirstOrDefaultAsync(s => s.NegocioId == negocioId && s.Plataforma == sku.Plataforma && s.SkuExterno == sku.SkuExterno);
                
                if (existing != null)
                {
                    return BadRequest(new { msg = "El SKU externo ya está mapeado para esta plataforma." });
                }

                await _context.SkuTerceros.AddAsync(sku);
                await _context.SaveChangesAsync();
                
                return Ok(new { msg = "Mapeo guardado correctamente.", id = sku.Id });
            }
            catch (Exception ex)
            {
                return BadRequest(new { msg = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSkuTercero(int id)
        {
            try
            {
                int negocioId = GetNegocioId();
                var sku = await _context.SkuTerceros.FirstOrDefaultAsync(s => s.Id == id && s.NegocioId == negocioId);
                
                if (sku == null) return NotFound("Mapeo no encontrado.");

                _context.SkuTerceros.Remove(sku);
                await _context.SaveChangesAsync();
                return Ok(new { msg = "Mapeo eliminado." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { msg = ex.Message });
            }
        }
    }
}
