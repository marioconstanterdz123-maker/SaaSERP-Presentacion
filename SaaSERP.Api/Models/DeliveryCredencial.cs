using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SaaSERP.Api.Models
{
    [Table("DeliveryCredenciales", Schema = "Core")]
    public class DeliveryCredencial
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int NegocioId { get; set; }

        [Required]
        [MaxLength(20)]
        public string Plataforma { get; set; } = string.Empty; // 'RAPPI' | 'UBEREATS' | 'DIDI'

        [Required]
        [MaxLength(200)]
        public string ClientId { get; set; } = string.Empty;

        [Required]
        [MaxLength(500)]
        public string ClientSecret { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? WebhookSecret { get; set; }

        [MaxLength(200)]
        public string? StoreId { get; set; }

        [MaxLength(10)]
        public string? PaisCode { get; set; }

        public bool Activo { get; set; } = true;

        public Negocio? Negocio { get; set; }
    }
}
