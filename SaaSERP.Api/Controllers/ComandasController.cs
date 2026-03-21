using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaaSERP.Api.Data;
using SaaSERP.Api.Models;

namespace SaaSERP.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    // [Authorize] // Candado puesto (removido para front)
    public class ComandasController : ControllerBase
    {
        private readonly SaaSContext _context;

        public ComandasController(SaaSContext context)
        {
            _context = context;
        }

        // ==========================================
        // LEER EL ID DEL NEGOCIO DESDE EL TOKEN
        // ==========================================
        private int ObtenerNegocioIdDelToken()
        {
            if (Request.Headers.TryGetValue("X-Negocio-Id", out var val))
                return int.Parse(val);
                
            var negocioIdClaim = User.FindFirst("NegocioId")?.Value;
            return int.Parse(negocioIdClaim ?? "0");
        }

        // ==========================================
        // 1. OBTENER COMANDAS ACTIVAS
        // ==========================================
        [HttpGet("activas")]
        public async Task<ActionResult<IEnumerable<Comanda>>> GetComandasActivas()
        {
            int miNegocioId = ObtenerNegocioIdDelToken();

            // Traemos las comandas del negocio que NO estén cobradas
            var comandas = await _context.Comandas
                                         .Where(c => c.NegocioId == miNegocioId && c.Estado != "Cobrada")
                                         .OrderBy(c => c.FechaCreacion)
                                         .ToListAsync();

            return Ok(comandas);
        }

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
        [HttpPost]
        public async Task<ActionResult<Comanda>> PostComanda(ComandaCreateDto dto)
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
                    // Usar Set<DetalleComanda>() porque DbContext no tiene una propiedad directa para DetalleComanda
                    _context.Set<DetalleComanda>().Add(nuevoDetalle);
                }
                await _context.SaveChangesAsync();
            }

            return Ok(nuevaComanda);
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

            comanda.Estado = dto.NuevoEstado;
            await _context.SaveChangesAsync();

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