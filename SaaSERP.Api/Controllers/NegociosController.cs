using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaaSERP.Api.Models;
using SaaSERP.Api.Services;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SaaSERP.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NegociosController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public NegociosController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        [Authorize(Roles = "SuperAdmin")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Negocio>>> Get()
        {
            var data = await _adminService.ObtenerTodosNegociosAsync();
            return Ok(data);
        }

        /// <summary>
        /// Endpoint accesible por CUALQUIER ROL autenticado (Mesero, Cajero, Cocinero, etc.)
        /// Devuelve la info del negocio al que pertenece el usuario según su token JWT.
        /// </summary>
        [HttpGet("mio")]
        public async Task<IActionResult> GetMio()
        {
            var negocioIdStr = User.FindFirst("NegocioId")?.Value;
            if (!int.TryParse(negocioIdStr, out var negocioId) || negocioId == 0)
                return BadRequest("Este usuario no pertenece a ningún negocio.");

            var negocio = await _adminService.ObtenerNegocioPorIdAsync(negocioId);
            if (negocio == null) return NotFound("Negocio no encontrado.");
            return Ok(negocio);
        }

        [Authorize(Roles = "SuperAdmin")]
        [HttpPost]
        public async Task<ActionResult<Negocio>> Post(Negocio negocio)
        {
            negocio.Id = await _adminService.CrearNegocioAsync(negocio);
            return Ok(negocio);
        }

        [Authorize(Roles = "SuperAdmin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, Negocio negocio)
        {
            if (id != negocio.Id) return BadRequest("El ID no coincide");
            bool result = await _adminService.ActualizarNegocioAsync(negocio);
            if (!result) return NotFound();
            return NoContent();
        }

        // ─── Feature Flags: Solo SuperAdmin ──────────────────────────────────
        [Authorize(Roles = "SuperAdmin")]
        [HttpPatch("{id}/modulos")]
        public async Task<IActionResult> PatchModulos(int id, [FromBody] ModulosDto dto)
        {
            var negocio = await _adminService.ObtenerNegocioPorIdAsync(id);
            if (negocio == null) return NotFound();

            negocio.AccesoWeb       = dto.AccesoWeb;
            negocio.AccesoMovil     = dto.AccesoMovil;
            negocio.ModuloHistorial = dto.ModuloHistorial;
            negocio.ModuloWhatsApp  = dto.ModuloWhatsApp;
            negocio.ModuloReportes  = dto.ModuloReportes;

            await _adminService.ActualizarNegocioAsync(negocio);
            return Ok(new { mensaje = "Módulos actualizados correctamente." });
        }
        // ─── Ajustes Operativos (Todos los Admin) ───────────────────────────
        [Authorize(Roles = "SuperAdmin,AdminNegocio")]
        [HttpPatch("{id}/ajustes-completos")]
        public async Task<IActionResult> PatchAjustesCompletos(int id, [FromBody] AjustesCompletosDto dto)
        {
            var negocio = await _adminService.ObtenerNegocioPorIdAsync(id);
            if (negocio == null) return NotFound();

            // Actualizar módulos
            negocio.AccesoWeb       = dto.AccesoWeb;
            negocio.AccesoMovil     = dto.AccesoMovil;
            negocio.ModuloHistorial = dto.ModuloHistorial;
            negocio.ModuloWhatsApp  = dto.ModuloWhatsApp;
            negocio.ModuloReportes  = dto.ModuloReportes;

            // Actualizar parámetros operativos
            if (!string.IsNullOrWhiteSpace(dto.TelefonoWhatsApp))
                negocio.TelefonoWhatsApp = dto.TelefonoWhatsApp;
            if (dto.CapacidadMaxima.HasValue)
                negocio.CapacidadMaxima = dto.CapacidadMaxima.Value;
            if (dto.DuracionMinutosCita.HasValue)
                negocio.DuracionMinutosCita = dto.DuracionMinutosCita.Value;
            if (dto.HoraApertura.HasValue)
                negocio.HoraApertura = dto.HoraApertura.Value;
            if (dto.HoraCierre.HasValue)
                negocio.HoraCierre = dto.HoraCierre.Value;
            negocio.UsaMesas = dto.UsaMesas;

            await _adminService.ActualizarNegocioAsync(negocio);
            return Ok(new { mensaje = "Configuración del negocio actualizada correctamente." });
        }
    }

    public class ModulosDto
    {
        public bool AccesoWeb       { get; set; }
        public bool AccesoMovil     { get; set; }
        public bool ModuloHistorial { get; set; }
        public bool ModuloWhatsApp  { get; set; }
        public bool ModuloReportes  { get; set; }
    }

    public class AjustesCompletosDto
    {
        // Módulos contratados
        public bool AccesoWeb       { get; set; }
        public bool AccesoMovil     { get; set; }
        public bool ModuloHistorial { get; set; }
        public bool ModuloWhatsApp  { get; set; }
        public bool ModuloReportes  { get; set; }

        // Configuración operativa
        public string? TelefonoWhatsApp  { get; set; }  // Teléfono del dueño para Owner Routing
        public int?    CapacidadMaxima   { get; set; }
        public int?    DuracionMinutosCita { get; set; }
        public TimeSpan? HoraApertura    { get; set; }
        public TimeSpan? HoraCierre      { get; set; }
        public bool    UsaMesas          { get; set; }
    }
}