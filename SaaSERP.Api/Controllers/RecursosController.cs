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
    public class RecursosController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public RecursosController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        [HttpGet("negocio/{negocioId}")]
        public async Task<ActionResult<IEnumerable<Recurso>>> GetByNegocio(int negocioId)
        {
            var data = await _adminService.ObtenerRecursosAdminAsync(negocioId);
            return Ok(data);
        }

        [HttpPost]
        public async Task<ActionResult<Recurso>> Post(Recurso recurso)
        {
            recurso.Id = await _adminService.CrearRecursoAsync(recurso);
            return Ok(recurso);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, Recurso recurso)
        {
            if (id != recurso.Id) return BadRequest("El ID no coincide");
            bool result = await _adminService.ActualizarRecursoAsync(recurso);
            if (!result) return NotFound();
            return NoContent();
        }
    }
}
