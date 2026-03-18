using System.ComponentModel.DataAnnotations;

namespace SaaSERP.Api.Models
{
    public class Cita
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int NegocioId { get; set; }

        [Required, MaxLength(20)]
        public string TelefonoCliente { get; set; } = string.Empty;

        [MaxLength(100)]
        public string NombreCliente { get; set; } = string.Empty;

        [Required]
        public DateTime FechaHoraInicio { get; set; }
        public DateTime FechaHoraFin { get; set; }

        [MaxLength(50)]
        public string Estado { get; set; } = "Confirmada";
    }
}