using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SaaSERP.Api.Models
{
    /// <summary>
    /// Rastrea el estado de cada conversación de WhatsApp activa.
    /// Una sesión por número de cliente por negocio.
    /// </summary>
    public class ChatSession
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int NegocioId { get; set; }

        /// <summary>Tatuador con el que el cliente está hablando</summary>
        public int? TrabajadorId { get; set; }

        [Required, MaxLength(30)]
        public string NumeroCliente { get; set; } = string.Empty;

        /// <summary>Nombre que la IA detectó del cliente</summary>
        [MaxLength(100)]
        public string? NombreCliente { get; set; }

        /// <summary>Cuando true, la IA no responde en este chat</summary>
        public bool ModoSilencio { get; set; } = false;

        /// <summary>La IA preguntó si quiere hablar con el humano y espera respuesta</summary>
        public bool EsperandoConfirmacionHandoff { get; set; } = false;

        public DateTime UltimoMensaje { get; set; } = DateTime.UtcNow;
        public DateTime? SilencioActivadoEn { get; set; }

        /// <summary>Si ya se envió el whisper/alerta al tatuador en este handoff</summary>
        public bool WhisperEnviado { get; set; } = false;

        // Navigation
        [ForeignKey("TrabajadorId")]
        public Trabajador? Trabajador { get; set; }
    }
}
