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
    // [Authorize] // Temporalmente desactivado para desarrollo Frontend
    public class NegociosController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public NegociosController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Negocio>>> Get()
        {
            var data = await _adminService.ObtenerTodosNegociosAsync();
            return Ok(data);
        }

        [HttpPost]
        public async Task<ActionResult<Negocio>> Post(Negocio negocio)
        {
            negocio.Id = await _adminService.CrearNegocioAsync(negocio);
            return Ok(negocio);
        }

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
    }

    public class ModulosDto
    {
        public bool AccesoWeb       { get; set; }
        public bool AccesoMovil     { get; set; }
        public bool ModuloHistorial { get; set; }
        public bool ModuloWhatsApp  { get; set; }
        public bool ModuloReportes  { get; set; }
    }
}