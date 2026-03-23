using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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

        [NotMapped]
        public int DuracionMinutos { get; set; }

        [MaxLength(50)]
        public string Estado { get; set; } = "Confirmada";

        public bool RecordatorioEnviado { get; set; } = false;

        // Campos Dinámicos Opcionales
        public int? ServicioId { get; set; }
        public int? RecursoId { get; set; }

        // Campos auxiliares (no se persisten en la BD)
        [NotMapped]
        public string? ServicioNombre { get; set; }
    }
}