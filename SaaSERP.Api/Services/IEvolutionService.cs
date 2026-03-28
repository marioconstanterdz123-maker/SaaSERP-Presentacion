using System.Threading.Tasks;

namespace SaaSERP.Api.Services
{
    public interface IEvolutionService
    {
        Task EnviarMensajeTextoAsync(string instancia, string numeroDestino, string texto, string? apiKey = null);
    }
}
