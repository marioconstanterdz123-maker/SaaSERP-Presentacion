using System.ComponentModel.DataAnnotations;

namespace SaaSERP.Api.Models
{
    public class Negocio
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string Nombre { get; set; } = string.Empty;

        [MaxLength(20)]
        public string TelefonoWhatsApp { get; set; } = string.Empty;

        public bool Activo { get; set; } = true;
        public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;

        [MaxLength(50)]
        public string SistemaAsignado { get; set; } = string.Empty; // "CITAS", "TAQUERIA", "PARQUEADERO"

        public int CapacidadMaxima { get; set; } = 0;
        public int DuracionMinutosCita { get; set; } = 60;
        public bool UsaMesas { get; set; } = false;
    }
}