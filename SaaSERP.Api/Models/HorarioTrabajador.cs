using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SaaSERP.Api.Models
{
    /// <summary>Disponibilidad semanal de un tatuador. DiaSemana: 0=Domingo, 1=Lunes...6=Sábado</summary>
    public class HorarioTrabajador
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int TrabajadorId { get; set; }

        /// <summary>0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado</summary>
        [Required]
        public int DiaSemana { get; set; }

        [Required]
        public TimeSpan HoraInicio { get; set; }

        [Required]
        public TimeSpan HoraFin { get; set; }

        // Navigation
        [ForeignKey("TrabajadorId")]
        public Trabajador? Trabajador { get; set; }
    }
}
