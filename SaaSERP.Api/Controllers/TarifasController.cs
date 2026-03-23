using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SaaSERP.Api.Data;
using SaaSERP.Api.Models;
using System.Data;

namespace SaaSERP.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TarifasController : ControllerBase
    {
        private readonly SaaSContext _context;

        public TarifasController(SaaSContext context)
        {
            _context = context;
        }

        private int GetNegocioId()
        {
            // Assuming NegocioId is passed in header 'NegocioId' as per requirement
            if (Request.Headers.TryGetValue("NegocioId", out var headerValue) && int.TryParse(headerValue, out int negocioId))
            {
                return negocioId;
            }
            throw new UnauthorizedAccessException("NegocioId no proporcionado en el header.");
        }

        [HttpGet("parqueadero")]
        public async Task<IActionResult> GetTarifaParqueadero()
        {
            try
            {
                int negocioId = GetNegocioId();
                var tarifa = await _context.TarifasEstadia.FirstOrDefaultAsync(t => t.NegocioId == negocioId);
                
                if (tarifa == null)
                {
                    // Si no existe, podemos retornarla con default values sin guardarla, o retornar 404
                    return Ok(new TarifaEstadia { NegocioId = negocioId });
                }

                return Ok(tarifa);
            }
            catch (Exception ex)
            {
                return BadRequest(new { msg = ex.Message });
            }
        }

        [Authorize(Roles = "SuperAdmin,AdminNegocio")]
        [HttpPut("parqueadero")]
        public async Task<IActionResult> UpdateTarifaParqueadero([FromBody] TarifaEstadia tarifa)
        {
            try
            {
                int negocioId = GetNegocioId();
                if (tarifa.NegocioId != negocioId)
                {
                    return BadRequest("El NegocioId no coincide.");
                }

                using var connection = _context.Database.GetDbConnection();
                if (connection.State != ConnectionState.Open)
                    await connection.OpenAsync();

                // Verifica si existe
                bool exists = await connection.ExecuteScalarAsync<bool>(
                    "SELECT CAST(COUNT(1) AS BIT) FROM Core.TarifaEstadia WHERE NegocioId = @NegocioId", 
                    new { NegocioId = negocioId });

                if (exists)
                {
                    // Update usando Dapper
                    string sqlUpdate = @"
                        UPDATE Core.TarifaEstadia
                        SET CostoPrimeraFraccion = @CostoPrimeraFraccion,
                            MinutosPrimeraFraccion = @MinutosPrimeraFraccion,
                            CostoFraccionAdicional = @CostoFraccionAdicional,
                            MinutosFraccionAdicional = @MinutosFraccionAdicional,
                            MinutosToleranciaEntrada = @MinutosToleranciaEntrada,
                            MinutosToleranciaFraccion = @MinutosToleranciaFraccion,
                            BoletoPerdido = @BoletoPerdido,
                            HeaderTicket = @HeaderTicket,
                            FooterTicket = @FooterTicket
                        WHERE NegocioId = @NegocioId";

                    await connection.ExecuteAsync(sqlUpdate, tarifa);
                }
                else
                {
                    // Inserta si no existe
                    string sqlInsert = @"
                        INSERT INTO Core.TarifaEstadia 
                        (NegocioId, CostoPrimeraFraccion, MinutosPrimeraFraccion, CostoFraccionAdicional, MinutosFraccionAdicional, MinutosToleranciaEntrada, MinutosToleranciaFraccion, BoletoPerdido, HeaderTicket, FooterTicket)
                        VALUES 
                        (@NegocioId, @CostoPrimeraFraccion, @MinutosPrimeraFraccion, @CostoFraccionAdicional, @MinutosFraccionAdicional, @MinutosToleranciaEntrada, @MinutosToleranciaFraccion, @BoletoPerdido, @HeaderTicket, @FooterTicket)";

                    await connection.ExecuteAsync(sqlInsert, tarifa);
                }

                return Ok(new { msg = "Tarifa actualizada correctamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { msg = ex.Message });
            }
        }
    }
}
