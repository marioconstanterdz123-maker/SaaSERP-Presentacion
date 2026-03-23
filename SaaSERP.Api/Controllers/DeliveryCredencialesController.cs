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
    public class DeliveryCredencialesController : ControllerBase
    {
        private readonly SaaSContext _context;

        public DeliveryCredencialesController(SaaSContext context)
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
        public async Task<IActionResult> GetCredenciales()
        {
            try
            {
                int negocioId = GetNegocioId();
                var credenciales = await _context.DeliveryCredenciales
                    .Where(c => c.NegocioId == negocioId)
                    .Select(c => new
                    {
                        c.Id,
                        c.Plataforma,
                        c.ClientId,
                        c.StoreId,
                        c.PaisCode,
                        c.Activo,
                        HasClientSecret = !string.IsNullOrEmpty(c.ClientSecret),
                        HasWebhookSecret = !string.IsNullOrEmpty(c.WebhookSecret)
                    })
                    .ToListAsync();

                return Ok(credenciales);
            }
            catch (Exception ex)
            {
                return BadRequest(new { msg = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> SaveCredencial([FromBody] DeliveryCredencial credencial)
        {
            try
            {
                int negocioId = GetNegocioId();
                credencial.NegocioId = negocioId;

                var existing = await _context.DeliveryCredenciales
                    .FirstOrDefaultAsync(c => c.NegocioId == negocioId && c.Plataforma == credencial.Plataforma);

                if (existing != null)
                {
                    existing.ClientId = credencial.ClientId;
                    if (!string.IsNullOrEmpty(credencial.ClientSecret))
                        existing.ClientSecret = credencial.ClientSecret;
                    if (!string.IsNullOrEmpty(credencial.WebhookSecret))
                        existing.WebhookSecret = credencial.WebhookSecret;

                    existing.StoreId = credencial.StoreId;
                    existing.PaisCode = credencial.PaisCode;
                    existing.Activo = credencial.Activo;
                    
                    _context.DeliveryCredenciales.Update(existing);
                }
                else
                {
                    await _context.DeliveryCredenciales.AddAsync(credencial);
                }

                await _context.SaveChangesAsync();
                return Ok(new { msg = "Credenciales guardadas correctamente." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { msg = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCredencial(int id)
        {
            try
            {
                int negocioId = GetNegocioId();
                var credencial = await _context.DeliveryCredenciales.FirstOrDefaultAsync(c => c.Id == id && c.NegocioId == negocioId);
                
                if (credencial == null) return NotFound("Credencial no encontrada.");

                _context.DeliveryCredenciales.Remove(credencial);
                await _context.SaveChangesAsync();
                return Ok(new { msg = "Integración eliminada." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { msg = ex.Message });
            }
        }
    }
}
