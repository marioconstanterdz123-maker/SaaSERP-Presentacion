using SaaSERP.Api.Models;
using System.Threading.Tasks;

namespace SaaSERP.Api.Services
{
    public interface IAIService
    {
        Task ProcesarMensajeEntranteAsync(string textoOriginal, Negocio negocio, string numeroCliente, string instancia);
    }
}
