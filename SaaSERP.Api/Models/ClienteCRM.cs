using System.ComponentModel.DataAnnotations;

namespace SaaSERP.Api.Models
{
    /// <summary>Perfil CRM de cada cliente que contacta vía WhatsApp o visita el negocio</summary>
    public class ClienteCRM
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int NegocioId { get; set; }

        [Required, MaxLength(30)]
        public string Telefono { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? NombreDetectado { get; set; }

        public DateTime PrimerContacto { get; set; } = DateTime.UtcNow;
        public DateTime UltimaInteraccion { get; set; } = DateTime.UtcNow;

        /// <summary>Número de citas con estado "Completada"</summary>
        public int TotalCitasCompletadas { get; set; } = 0;

        /// <summary>Nivel de lealtad calculado dinámicamente (ej: "VIP", "Regular")</summary>
        [MaxLength(50)]
        public string? NivelLealtad { get; set; }

        /// <summary>Porcentaje de descuento activo basado en la regla de lealtad</summary>
        public decimal DescuentoActivo { get; set; } = 0;
    }
}
