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
    public class HandoffController : ControllerBase
    {
        private readonly SaaSContext _context;

        public HandoffController(SaaSContext context) => _context = context;

        // GET /api/Handoff/{negocioId}/sesiones
        // Lista todos los chats actualmente en modo silencio
        [HttpGet("{negocioId}/sesiones")]
        public async Task<IActionResult> ListarSesiones(int negocioId)
        {
            var sesiones = await _context.ChatSessions
                .Include(s => s.Trabajador)
                .Where(s => s.NegocioId == negocioId && s.ModoSilencio)
                .Select(s => new
                {
                    s.Id, s.NumeroCliente, s.NombreCliente,
                    s.ModoSilencio, s.SilencioActivadoEn, s.UltimoMensaje,
                    Trabajador = s.Trabajador == null ? null : new { s.Trabajador.Id, s.Trabajador.Nombre }
                })
                .ToListAsync();
            return Ok(sesiones);
        }

        // POST /api/Handoff/{negocioId}/silence/{numero}
        // Activar silencio manualmente (desde el panel)
        [HttpPost("{negocioId}/silence/{numero}")]
        public async Task<IActionResult> ActivarSilencio(int negocioId, string numero)
        {
            var sesion = await ObtenerOCrearSesion(negocioId, numero);
            sesion.ModoSilencio = true;
            sesion.SilencioActivadoEn = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Modo silencio activado." });
        }

        // POST /api/Handoff/{negocioId}/reactivar/{numero}
        // Reactivar IA manualmente (tatuador marca trato concluido)
        [HttpPost("{negocioId}/reactivar/{numero}")]
        public async Task<IActionResult> ReactivarIA(int negocioId, string numero)
        {
            var sesion = await _context.ChatSessions
                .FirstOrDefaultAsync(s => s.NegocioId == negocioId && s.NumeroCliente == numero);

            if (sesion == null) return NotFound(new { error = "Sesión no encontrada." });

            sesion.ModoSilencio = false;
            sesion.EsperandoConfirmacionHandoff = false;
            sesion.WhisperEnviado = false;
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "IA reactivada para este chat." });
        }

        private async Task<ChatSession> ObtenerOCrearSesion(int negocioId, string numero)
        {
            var sesion = await _context.ChatSessions
                .FirstOrDefaultAsync(s => s.NegocioId == negocioId && s.NumeroCliente == numero);

            if (sesion == null)
            {
                sesion = new ChatSession { NegocioId = negocioId, NumeroCliente = numero };
                _context.ChatSessions.Add(sesion);
            }
            return sesion;
        }
    }
}
