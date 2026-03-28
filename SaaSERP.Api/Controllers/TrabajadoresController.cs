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
    public class TrabajadoresController : ControllerBase
    {
        private readonly SaaSContext _context;

        public TrabajadoresController(SaaSContext context) => _context = context;

        // GET /api/Trabajadores/negocio/{negocioId}
        [HttpGet("negocio/{negocioId}")]
        public async Task<IActionResult> ListarPorNegocio(int negocioId)
        {
            var trabajadores = await _context.Trabajadores
                .Include(t => t.Horarios)
                .Where(t => t.NegocioId == negocioId && t.Activo)
                .Select(t => new
                {
                    t.Id, t.Nombre, t.Telefono, t.Email,
                    t.InstanciaWhatsApp, t.Activo,
                    Horarios = t.Horarios.Select(h => new
                    {
                        h.Id, h.DiaSemana, h.HoraInicio, h.HoraFin
                    })
                })
                .ToListAsync();
            return Ok(trabajadores);
        }

        // GET /api/Trabajadores/{id}/disponibilidad?fecha=YYYY-MM-DD
        [HttpGet("{id}/disponibilidad")]
        public async Task<IActionResult> ObtenerDisponibilidad(int id, [FromQuery] string fecha)
        {
            var trabajador = await _context.Trabajadores
                .Include(t => t.Horarios)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (trabajador == null) return NotFound();
            if (!DateTime.TryParse(fecha, out var fechaDt))
                return BadRequest(new { error = "Fecha inválida. Usar formato YYYY-MM-DD." });

            int diaSemana = (int)fechaDt.DayOfWeek;
            var horarioDia = trabajador.Horarios.FirstOrDefault(h => h.DiaSemana == diaSemana);
            if (horarioDia == null)
                return Ok(new { disponible = false, slots = Array.Empty<object>() });

            // Buscar citas existentes ese día para este trabajador
            var citasDelDia = await _context.Citas
                .Where(c =>
                    c.TrabajadorId == id &&
                    c.FechaHoraInicio.Date == fechaDt.Date &&
                    c.Estado != "Cancelada")
                .Select(c => new { c.FechaHoraInicio, c.FechaHoraFin })
                .ToListAsync();

            // Generar slots de 30 minutos dentro del horario del trabajador
            var slots = new List<object>();
            var cursor = fechaDt.Date + horarioDia.HoraInicio;
            var fin = fechaDt.Date + horarioDia.HoraFin;

            while (cursor.AddMinutes(30) <= fin)
            {
                var slotFin = cursor.AddMinutes(30);
                bool ocupado = citasDelDia.Any(c => c.FechaHoraInicio < slotFin && c.FechaHoraFin > cursor);
                slots.Add(new { inicio = cursor, fin = slotFin, libre = !ocupado });
                cursor = slotFin;
            }

            return Ok(new { disponible = true, trabajador = trabajador.Nombre, slots });
        }

        // POST /api/Trabajadores
        [HttpPost]
        [Authorize(Roles = "SuperAdmin,AdminNegocio")]
        public async Task<IActionResult> Crear([FromBody] TrabajadorDto dto)
        {
            var trabajador = new Trabajador
            {
                NegocioId = dto.NegocioId,
                Nombre = dto.Nombre,
                Telefono = dto.Telefono,
                Email = dto.Email,
                Activo = true
            };
            _context.Trabajadores.Add(trabajador);
            await _context.SaveChangesAsync();

            // Guardar horarios si se proporcionaron
            if (dto.Horarios?.Any() == true)
            {
                foreach (var h in dto.Horarios)
                {
                    _context.HorariosTrabajadores.Add(new HorarioTrabajador
                    {
                        TrabajadorId = trabajador.Id,
                        DiaSemana = h.DiaSemana,
                        HoraInicio = h.HoraInicio,
                        HoraFin = h.HoraFin
                    });
                }
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(ListarPorNegocio), new { negocioId = dto.NegocioId }, trabajador);
        }

        // PUT /api/Trabajadores/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "SuperAdmin,AdminNegocio")]
        public async Task<IActionResult> Editar(int id, [FromBody] TrabajadorDto dto)
        {
            var trabajador = await _context.Trabajadores.FindAsync(id);
            if (trabajador == null) return NotFound();

            trabajador.Nombre = dto.Nombre;
            trabajador.Telefono = dto.Telefono;
            trabajador.Email = dto.Email;

            // Reemplazar horarios
            if (dto.Horarios != null)
            {
                var viejos = _context.HorariosTrabajadores.Where(h => h.TrabajadorId == id);
                _context.HorariosTrabajadores.RemoveRange(viejos);
                foreach (var h in dto.Horarios)
                {
                    _context.HorariosTrabajadores.Add(new HorarioTrabajador
                    {
                        TrabajadorId = id,
                        DiaSemana = h.DiaSemana,
                        HoraInicio = h.HoraInicio,
                        HoraFin = h.HoraFin
                    });
                }
            }
            await _context.SaveChangesAsync();
            return Ok(trabajador);
        }

        // DELETE /api/Trabajadores/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "SuperAdmin,AdminNegocio")]
        public async Task<IActionResult> Eliminar(int id)
        {
            var trabajador = await _context.Trabajadores.FindAsync(id);
            if (trabajador == null) return NotFound();
            trabajador.Activo = false;
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Trabajador desactivado." });
        }
    }

    // DTOs
    public class TrabajadorDto
    {
        public int NegocioId { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Telefono { get; set; }
        public string? Email { get; set; }
        public List<HorarioDto>? Horarios { get; set; }
    }

    public class HorarioDto
    {
        public int DiaSemana { get; set; }
        public TimeSpan HoraInicio { get; set; }
        public TimeSpan HoraFin { get; set; }
    }
}
