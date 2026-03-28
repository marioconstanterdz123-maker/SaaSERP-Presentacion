using SaaSERP.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SaaSERP.Api.Services
{
    public interface IAdminService
    {
        // Negocios
        Task<IEnumerable<Negocio>> ObtenerTodosNegociosAsync();
        Task<Negocio?> ObtenerNegocioPorIdAsync(int id);
        Task<int> CrearNegocioAsync(Negocio negocio);
        Task<bool> ActualizarNegocioAsync(Negocio negocio);
        Task EliminarLogicoAsync(int id);
        Task<IEnumerable<Negocio>> ObtenerPapeleraAsync();
        Task RestaurarAsync(int id);
        Task EliminarDefinitivoAsync(int id);
        Task RenovarSuscripcionAsync(int id, int dias);



        // Servicios
        Task<IEnumerable<Servicio>> ObtenerServiciosAdminAsync(int negocioId);
        Task<int> CrearServicioAsync(Servicio servicio);
        Task<bool> ActualizarServicioAsync(Servicio servicio);

        // Recursos
        Task<IEnumerable<Recurso>> ObtenerRecursosAdminAsync(int negocioId);
        Task<int> CrearRecursoAsync(Recurso recurso);
        Task<bool> ActualizarRecursoAsync(Recurso recurso);
    }
}
