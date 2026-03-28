using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaaSERP.Api.Data;
using SaaSERP.Api.Models;

namespace SaaSERP.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "SuperAdmin,AdminNegocio")]
    public class ReglasBonificacionController : ControllerBase
    {
        private readonly SaaSContext _context;

        public ReglasBonificacionController(SaaSContext context) => _context = context;

        // GET /api/Lealtad/negocio/{negocioId}
        [HttpGet("negocio/{negocioId}")]
        public async Task<IActionResult> Listar(int negocioId)
        {
            var reglas = await _context.ReglasBonificacion
                .Where(r => r.NegocioId == negocioId)
                .OrderBy(r => r.CitasRequeridas)
                .ToListAsync();
            return Ok(reglas);
        }

        // POST /api/Lealtad
        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] ReglaBonificacion regla)
        {
            _context.ReglasBonificacion.Add(regla);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(Listar), new { negocioId = regla.NegocioId }, regla);
        }

        // PUT /api/Lealtad/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Editar(int id, [FromBody] ReglaBonificacion dto)
        {
            var regla = await _context.ReglasBonificacion.FindAsync(id);
            if (regla == null) return NotFound();

            regla.Nombre = dto.Nombre;
            regla.CitasRequeridas = dto.CitasRequeridas;
            regla.VentanaMeses = dto.VentanaMeses;
            regla.NivelNombre = dto.NivelNombre;
            regla.Descuento = dto.Descuento;
            regla.Activa = dto.Activa;
            await _context.SaveChangesAsync();
            return Ok(regla);
        }

        // DELETE /api/Lealtad/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Eliminar(int id)
        {
            var regla = await _context.ReglasBonificacion.FindAsync(id);
            if (regla == null) return NotFound();
            _context.ReglasBonificacion.Remove(regla);
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Regla eliminada." });
        }
    }
}
