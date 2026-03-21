using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SaaSERP.Api.Models
{
    public class Comanda
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int NegocioId { get; set; }

        [Required]
        public string TelefonoCliente { get; set; } = string.Empty;

        [Required, MaxLength(100)]
        public string NombreCliente { get; set; } = string.Empty;

        [MaxLength(50)]
        public string TipoAtencion { get; set; } = "Mostrador";

        [MaxLength(50)]
        public string IdentificadorMesa { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Total { get; set; }

        [MaxLength(50)]
        public string Estado { get; set; } = "Recibida";

        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
        
        // Navigation Property - Not mapped to DB exactly, used in DTOs
        public List<DetalleComanda> Detalles { get; set; } = new List<DetalleComanda>();
    }
}