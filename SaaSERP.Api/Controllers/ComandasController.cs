using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SaaSERP.Api.Data;
using SaaSERP.Api.Models;
using SaaSERP.Api.Services;

namespace SaaSERP.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ComandasController : ControllerBase
    {
        private readonly SaaSContext _context;
        private readonly IServiceScopeFactory _scopeFactory;

        public ComandasController(SaaSContext context, IServiceScopeFactory scopeFactory)
        {
            _context = context;
            _scopeFactory = scopeFactory;
        }

        // ==========================================
        // LEER EL ID DEL NEGOCIO DESDE EL TOKEN
        // ==========================================
        private int ObtenerNegocioIdDelToken()
        {
            if (Request.Headers.TryGetValue("X-Negocio-Id", out var val) && int.TryParse(val, out var id))
                return id;
            var claim = User.FindFirst("NegocioId")?.Value;
            return int.TryParse(claim, out var claimId) ? claimId : 0;
        }

        // ==========================================
        // 1. OBTENER COMANDAS ACTIVAS
        // ==========================================
        [HttpGet("activas")]
        public async Task<IActionResult> GetComandasActivas()
        {
            int miNegocioId = ObtenerNegocioIdDelToken();

            // Traemos las comandas del negocio que NO estén cobradas
            var comandas = await _context.Comandas
                                         .Where(c => c.NegocioId == miNegocioId && c.Estado != "Cobrada" && c.Estado != "Cancelada")
                                         .Select(c => new
                                         {
                                             c.Id,
                                             c.NegocioId,
                                             c.NombreCliente,
                                             c.IdentificadorMesa,
                                             c.TelefonoCliente,
                                             c.TipoAtencion,
                                             c.Estado,
                                             c.Total,
                                             c.FechaCreacion,
                                             detalles = _context.DetallesComanda
                                                 .Where(d => d.ComandaId == c.Id)
                                                 .Join(_context.Servicios, d => d.ServicioId, s => s.Id, (d, s) => new
                                                 {
                                                     d.Id,
                                                     d.ComandaId,
                                                     d.ServicioId,
                                                     nombreProducto = s.Nombre,
                                                     nombreServicio = s.Nombre,
                                                     d.Cantidad,
                                                     d.Subtotal,
                                                     d.NotasOpcionales
                                                 }).ToList()
                                         })
                                         .OrderBy(c => c.FechaCreacion)
                                         .ToListAsync();

            return Ok(comandas);
        }

        [Authorize(Roles = "SuperAdmin,AdminNegocio,Cajero")]
        [HttpGet("historial")]
        public async Task<ActionResult<IEnumerable<Comanda>>> GetComandasHistorial()
        {
            int miNegocioId = ObtenerNegocioIdDelToken();

            // Historial: Traemos comandas del negocio que YA estén cobradas (o canceladas)
            var historial = await _context.Comandas
                                          .Where(c => c.NegocioId == miNegocioId && (c.Estado == "Cobrada" || c.Estado == "Cancelada"))
                                          .OrderByDescending(c => c.FechaCreacion)
                                          .ToListAsync();

            return Ok(historial);
        }

        // ==========================================
        // 2. CREAR UNA NUEVA COMANDA
        // ==========================================
        [Authorize(Roles = "SuperAdmin,AdminNegocio,Cajero,Mesero")]
        [HttpPost]
        public async Task<ActionResult<Comanda>> PostComanda(ComandaCreateDto dto)
        {
            try
            {
                int miNegocioId = ObtenerNegocioIdDelToken();

                // 1. Crear el encabezado de la Comanda
                var nuevaComanda = new Comanda
                {
                    NegocioId = miNegocioId,
                    TelefonoCliente = dto.TelefonoCliente,
                    NombreCliente = dto.NombreCliente,
                    TipoAtencion = dto.TipoAtencion,
                    IdentificadorMesa = dto.IdentificadorMesa,
                    Total = dto.Total,
                    Estado = "Recibida"
                };

                _context.Comandas.Add(nuevaComanda);
                await _context.SaveChangesAsync(); // Para obtener el Id

                // 2. Insertar los detalles (ítems)
                if (dto.Detalles != null && dto.Detalles.Any())
                {
                    foreach (var det in dto.Detalles)
                    {
                        var nuevoDetalle = new DetalleComanda
                        {
                            ComandaId = nuevaComanda.Id,
                            ServicioId = det.ServicioId,
                            Cantidad = det.Cantidad,
                            Subtotal = det.Subtotal,
                            NotasOpcionales = det.NotasOpcionales ?? ""
                        };
                        _context.DetallesComanda.Add(nuevoDetalle);
                    }
                    await _context.SaveChangesAsync();
                }

                return Ok(nuevaComanda);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message, stack = ex.StackTrace });
            }
        }

        // ==========================================
        // 2.5. OBTENER DETALLES DE UNA COMANDA
        // ==========================================
        [HttpGet("{id}/detalles")]
        public async Task<ActionResult<IEnumerable<dynamic>>> GetDetalles(int id)
        {
            int miNegocioId = ObtenerNegocioIdDelToken();

            // Validamos que la comanda pertenezca al negocio actual
            bool existe = await _context.Comandas.AnyAsync(c => c.Id == id && c.NegocioId == miNegocioId);
            if (!existe) return NotFound();

            // Usamos Join para traer el nombre del servicio/producto (si está en la tabla Servicios)
            var detalles = await _context.Set<DetalleComanda>()
                .Where(d => d.ComandaId == id)
                .Join(
                    _context.Set<Servicio>(), // Supongo que tienes un DbSet<Servicio>
                    d => d.ServicioId,
                    s => s.Id,
                    (d, s) => new
                    {
                        d.Id,
                        d.ComandaId,
                        d.ServicioId,
                        NombreProducto = s.Nombre,
                        d.Cantidad,
                        d.Subtotal,
                        d.NotasOpcionales
                    }
                )
                .ToListAsync();

            return Ok(detalles);
        }

        // ==========================================
        // 3. ACTUALIZAR ESTADO DE LA COMANDA
        // ==========================================
        [HttpPut("{id}/estado")]
        public async Task<IActionResult> ActualizarEstado(int id, [FromBody] EstadoUpdateDto dto)
        {
            int miNegocioId = ObtenerNegocioIdDelToken();

            var comanda = await _context.Comandas
                                        .FirstOrDefaultAsync(c => c.Id == id && c.NegocioId == miNegocioId);

            if (comanda == null)
                return NotFound(new { Mensaje = "Comanda no encontrada" });

            if (dto.NuevoEstado == "Cobrada")
            {
                var userRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
                if (userRole != "SuperAdmin" && userRole != "AdminNegocio" && userRole != "Cajero")
                    return StatusCode(403, new { Mensaje = "No tiene permisos para cobrar (Solo Cajero o superior)." });
            }

            comanda.Estado = dto.NuevoEstado;
            await _context.SaveChangesAsync();

            // Lógica de Notificación Automática (Fase 3)
            if (dto.NuevoEstado == "Lista" && !string.IsNullOrWhiteSpace(comanda.TelefonoCliente))
            {
                var negocio = await _context.Negocios.FindAsync(miNegocioId);
                if (negocio != null && !string.IsNullOrWhiteSpace(negocio.InstanciaWhatsApp) && negocio.ModuloWhatsApp)
                {
                    string instancia = negocio.InstanciaWhatsApp;
                    string mcliente = comanda.NombreCliente;
                    string mtelefono = comanda.TelefonoCliente;
                    string mtipoAtencion = comanda.TipoAtencion ?? "Mostrador";

                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            using var scope = _scopeFactory.CreateScope();
                            var evoService = scope.ServiceProvider.GetRequiredService<IEvolutionService>();
                            
                            string msj = (mtipoAtencion == "Llevar" || mtipoAtencion == "Mostrador")
                                ? $"¡Hola {mcliente}! Tu pedido ya está listo para que pases a recogerlo. 🥳"
                                : $"¡Hola {mcliente}! Tu orden ya está lista para tu mesa. 🥳";

                            await evoService.EnviarMensajeTextoAsync(instancia, mtelefono, msj);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Error notificando pedido listo por WA: {ex.Message}");
                        }
                    });
                }
            }

            return Ok(new { Mensaje = $"Actualizada a: {dto.NuevoEstado}", Comanda = comanda });
        }

        // Agregamos este mini DTO al final del archivo
        public class EstadoUpdateDto
        {
            public string NuevoEstado { get; set; } = string.Empty;
        }
    }

    // ==========================================
    // DTO: Lo que manda la App o n8n
    // ==========================================
    public class ComandaCreateDto
    {
        public string TelefonoCliente { get; set; } = string.Empty;
        public string NombreCliente { get; set; } = string.Empty;
        public string TipoAtencion { get; set; } = "Mostrador";
        public string IdentificadorMesa { get; set; } = string.Empty;
        public decimal Total { get; set; }
        
        public List<DetalleComandaDto> Detalles { get; set; } = new();
    }

    public class DetalleComandaDto
    {
        public int ServicioId { get; set; }
        public int Cantidad { get; set; }
        public decimal Subtotal { get; set; }
        public string? NotasOpcionales { get; set; }
    }
}