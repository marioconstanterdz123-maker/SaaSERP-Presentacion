using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaaSERP.Api.Data;
using SaaSERP.Api.Models;

namespace SaaSERP.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportesController : ControllerBase
    {
        private readonly SaaSContext _context;

        public ReportesController(SaaSContext context)
        {
            _context = context;
        }

        private int ObtenerNegocioId()
        {
            if (Request.Headers.TryGetValue("X-Negocio-Id", out var val) && int.TryParse(val, out var id))
                return id;
            return 0;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardKpis()
        {
            int negocioId = ObtenerNegocioId();
            if (negocioId == 0) return BadRequest(new { Mensaje = "Se requiere la cabecera X-Negocio-Id" });

            var negocio = await _context.Negocios.FindAsync(negocioId);
            if (negocio == null) return NotFound(new { Mensaje = "Negocio no encontrado" });

            // Inicializar contadores comunes
            int clientesRegistrados = 0;
            int comandasActivas = 0;
            int vehiculosAdentro = 0;
            decimal ingresosHoy = 0m;
            double crecimiento = 15.0; // Todo: Cálculo real vs día anterior
            int ocupacionMesas = 0;
            var ingresosSemana = new List<object>();
            var startDate = DateTime.Today.AddDays(-6); // Últimos 7 días

            if (negocio.SistemaAsignado == "PARQUEADERO")
            {
                // Vehiculos Adentro
                vehiculosAdentro = await _context.Tickets
                    .CountAsync(t => t.NegocioId == negocioId && t.Estado == "Activo");

                // Cobros y Clientes en el día
                var statsHoy = await _context.Tickets
                    .Where(t => t.NegocioId == negocioId && t.Estado == "Cerrado" && t.HoraSalida.HasValue && t.HoraSalida.Value.Date == DateTime.Today)
                    .GroupBy(t => 1)
                    .Select(g => new { 
                        Ingresos = g.Sum(t => t.MontoCalculado ?? 0m), 
                        Clientes = g.Count() 
                    })
                    .FirstOrDefaultAsync();

                if (statsHoy != null) {
                    ingresosHoy = statsHoy.Ingresos;
                    clientesRegistrados = statsHoy.Clientes;
                }

                // Ingresos Semana
                var ticketsSemana = await _context.Tickets
                    .Where(t => t.NegocioId == negocioId && t.Estado == "Cerrado" && t.HoraSalida.HasValue && t.HoraSalida.Value >= startDate)
                    .ToListAsync();
                var agrupadoP = ticketsSemana
                    .GroupBy(t => t.HoraSalida!.Value.Date)
                    .Select(g => new { name = g.Key.ToString("dd MMM"), ventas = (double)g.Sum(t => t.MontoCalculado ?? 0m) })
                    .OrderBy(g => g.name)
                    .ToList();
                ingresosSemana.AddRange(agrupadoP);
            }
            else if (negocio.SistemaAsignado == "TAQUERIA" || negocio.SistemaAsignado == "RESTAURANTES")
            {
                // Comandas activas
                comandasActivas = await _context.Comandas
                    .CountAsync(c => c.NegocioId == negocioId && c.Estado != "Cobrada" && c.Estado != "Cancelada");

                // Cobros y Clientes en el día
                var statsHoy = await _context.Comandas
                    .Where(c => c.NegocioId == negocioId && c.Estado == "Cobrada" && c.FechaCreacion.Date == DateTime.Today)
                    .GroupBy(c => 1)
                    .Select(g => new { 
                        Ingresos = g.Sum(c => c.Total), 
                        Clientes = g.Count() 
                    })
                    .FirstOrDefaultAsync();

                if (statsHoy != null) {
                    ingresosHoy = statsHoy.Ingresos;
                    clientesRegistrados = statsHoy.Clientes;
                }

                // Ingresos Semana
                var comandasSemana = await _context.Comandas
                    .Where(c => c.NegocioId == negocioId && c.Estado == "Cobrada" && c.FechaCreacion >= startDate)
                    .ToListAsync();
                var agrupadoC = comandasSemana
                    .GroupBy(c => c.FechaCreacion.Date)
                    .Select(g => new { name = g.Key.ToString("dd MMM"), ventas = (double)g.Sum(c => c.Total) })
                    .OrderBy(g => g.name)
                    .ToList();
                ingresosSemana.AddRange(agrupadoC);
            }
            else if (negocio.SistemaAsignado == "CITAS")
            {
                // Mock para Citas (aún no se ha especificado KPIs para citas)
                clientesRegistrados = 12;
                ingresosHoy = 850m;
                ingresosSemana.Add(new { name = "Lun", ventas = 1200 });
                ingresosSemana.Add(new { name = "Mar", ventas = 850 });
            }

            return Ok(new
            {
                ingresosHoy,
                crecimiento,
                clientesRegistrados,
                comandasActivas,
                vehiculosAdentro,
                ocupacionMesas,
                ingresosSemana
            });
        }
    }
}
