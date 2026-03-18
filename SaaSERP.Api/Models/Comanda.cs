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

        [MaxLength(50)]
        public string IdentificadorAtencion { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string ResumenPedido { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Total { get; set; }

        [MaxLength(50)]
        public string Estado { get; set; } = "Recibida";

        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    }
}