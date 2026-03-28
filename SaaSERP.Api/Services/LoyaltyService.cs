using Microsoft.EntityFrameworkCore;
using SaaSERP.Api.Data;
using SaaSERP.Api.Models;

namespace SaaSERP.Api.Services
{
    public interface ILoyaltyService
    {
        Task EvaluarLealtadClienteAsync(int negocioId, string telefono);
    }

    public class LoyaltyService : ILoyaltyService
    {
        private readonly SaaSContext _context;

        public LoyaltyService(SaaSContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Evalúa si el cliente cumple alguna regla de bonificación del negocio
        /// y actualiza su nivel en ClientesCRM. Llamar cada vez que se completa una cita.
        /// </summary>
        public async Task EvaluarLealtadClienteAsync(int negocioId, string telefono)
        {
            var cliente = await _context.ClientesCRM
                .FirstOrDefaultAsync(c => c.NegocioId == negocioId && c.Telefono == telefono);

            if (cliente == null) return;

            var reglas = await _context.ReglasBonificacion
                .Where(r => r.NegocioId == negocioId && r.Activa)
                .OrderByDescending(r => r.CitasRequeridas)
                .ToListAsync();

            // Contar citas completadas en la ventana de la regla más exigente primero
            ReglaBonificacion? reglaActiva = null;
            foreach (var regla in reglas)
            {
                var ventanaInicio = DateTime.UtcNow.AddMonths(-regla.VentanaMeses);
                var citasEnVentana = await _context.Citas
                    .CountAsync(c =>
                        c.NegocioId == negocioId &&
                        c.TelefonoCliente == telefono &&
                        c.Estado == "Completada" &&
                        c.FechaHoraInicio >= ventanaInicio);

                if (citasEnVentana >= regla.CitasRequeridas)
                {
                    reglaActiva = regla;
                    break; // La primera que cumple (más exigente) gana
                }
            }

            // Actualizar cliente
            cliente.NivelLealtad = reglaActiva?.NivelNombre;
            cliente.DescuentoActivo = reglaActiva?.Descuento ?? 0;
            await _context.SaveChangesAsync();
        }
    }
}
