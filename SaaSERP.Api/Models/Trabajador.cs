using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SaaSERP.Api.Models
{
    public class Trabajador
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int NegocioId { get; set; }

        [Required, MaxLength(100)]
        public string Nombre { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? Telefono { get; set; }

        [MaxLength(150)]
        public string? Email { get; set; }

        /// <summary>Nombre de la instancia en EvolutionAPI: trabajador_{Id}</summary>
        [MaxLength(100)]
        public string? InstanciaWhatsApp { get; set; }

        /// <summary>API key específica para la instancia de este trabajador (si difiere de la global)</summary>
        [MaxLength(200)]
        public string? ApiKeyEvolution { get; set; }

        public bool Activo { get; set; } = true;

        // Navigation
        public ICollection<HorarioTrabajador> Horarios { get; set; } = new List<HorarioTrabajador>();
        public ICollection<Cita> Citas { get; set; } = new List<Cita>();
    }
}
