using Microsoft.AspNetCore.Mvc;
using SaaSERP.Api.Models;
using System;
using System.Globalization;

namespace SaaSERP.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FechaController : ControllerBase
    {
        [HttpGet("actual")]
        public IActionResult ObtenerFechaActual()
        {
            // Usamos la cultura de español para que el nombre del día se mande en español
            var cultura = new CultureInfo("es-MX");
            var ahora = DateTime.Now;

            var info = new InfoFecha
            {
                FechaCompleta = ahora.ToString("yyyy-MM-dd HH:mm:ss"),
                DiaSemana = ahora.ToString("dddd", cultura), // Ej. "lunes", "sábado"
                Anio = ahora.Year,
                Mes = ahora.Month,
                Dia = ahora.Day,
                HoraExacta = ahora.ToString("HH:mm:ss")
            };

            return Ok(info);
        }
    }
}
