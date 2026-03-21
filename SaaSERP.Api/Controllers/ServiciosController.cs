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
    public class ServiciosController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public ServiciosController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        [HttpGet("negocio/{negocioId}")]
        public async Task<ActionResult<IEnumerable<Servicio>>> GetByNegocio(int negocioId)
        {
            var data = await _adminService.ObtenerServiciosAdminAsync(negocioId);
            return Ok(data);
        }

        [HttpPost]
        public async Task<ActionResult<Servicio>> Post(Servicio servicio)
        {
            servicio.Id = await _adminService.CrearServicioAsync(servicio);
            return Ok(servicio);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, Servicio servicio)
        {
            if (id != servicio.Id) return BadRequest("El ID no coincide");
            bool result = await _adminService.ActualizarServicioAsync(servicio);
            if (!result) return NotFound();
            return NoContent();
        }
    }
}
