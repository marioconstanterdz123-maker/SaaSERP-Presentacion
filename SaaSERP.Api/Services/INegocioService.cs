using SaaSERP.Api.Models;
using System.Threading.Tasks;

namespace SaaSERP.Api.Services
{
    public interface INegocioService
    {
        Task<Negocio?> ObtenerConfiguracionNegocioAsync(string instanciaOTelefono);
        Task<Negocio?> ObtenerConfiguracionPorIdAsync(int id);
        
        // Catálogos dinámicos
        Task<System.Collections.Generic.IEnumerable<Servicio>> ObtenerServiciosAsync(int negocioId);
        Task<System.Collections.Generic.IEnumerable<Recurso>> ObtenerRecursosAsync(int negocioId);
    }
}
