using SaaSERP.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SaaSERP.Api.Services
{
    public interface IComandaService
    {
        Task<(int ComandaId, decimal TotalCalculado)> CrearComandaAsync(Comanda comanda, List<DetalleComanda> detalles);
        Task<Comanda?> ObtenerEstadoComandaAsync(int negocioId, string telefonoCliente);
    }
}
