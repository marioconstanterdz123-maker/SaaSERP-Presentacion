using System.Collections.Generic;
using System.Threading.Tasks;

namespace SaaSERP.Api.Services
{
    public class ChatMessage
    {
        public int Id { get; set; }
        public string TelefonoCliente { get; set; } = string.Empty;
        public string Rol { get; set; } = string.Empty;
        public string Contenido { get; set; } = string.Empty;
        public System.DateTime FechaCreacion { get; set; }
    }

    public interface IChatMemoryService
    {
        Task InicializarTablaAsync();
        Task GuardarMensajeAsync(string telefono, string rol, string contenido);
        Task<List<ChatMessage>> ObtenerHistorialAsync(string telefono, int limite = 20);
        Task LimpiarHistorialAsync(string telefono);
    }
}
