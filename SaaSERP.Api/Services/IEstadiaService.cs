using System.Threading.Tasks;

namespace SaaSERP.Api.Services
{
    public interface IEstadiaService
    {
        Task<int> RegistrarEntradaAsync(int negocioId, string placa);
        // Devuelve un Tuple o un objeto anonimo/dto
        Task<(int EstadiaId, decimal MontoTotal, int MinutosTranscurridos, string Detalle)> CalcularCobroAsync(int negocioId, string placa, bool soloCalcular = true);
    }
}
