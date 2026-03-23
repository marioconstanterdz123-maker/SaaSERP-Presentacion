using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SaaSERP.Api.Models
{
    [Table("SkuTerceros", Schema = "Core")]
    public class SkuTercero
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
        public string SkuExterno { get; set; } = string.Empty;

        [Required]
        public int ServicioId { get; set; }

        public Negocio? Negocio { get; set; }
        
        public Servicio? Servicio { get; set; }
    }
}
