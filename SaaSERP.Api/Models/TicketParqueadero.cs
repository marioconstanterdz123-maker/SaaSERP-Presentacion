using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SaaSERP.Api.Models
{
    public class TicketParqueadero
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int NegocioId { get; set; }

        [Required, MaxLength(20)]
        public string Placa { get; set; } = string.Empty;

        [Required]
        public DateTime HoraEntrada { get; set; }
        public DateTime? HoraSalida { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? MontoCalculado { get; set; }

        [MaxLength(50)]
        public string Estado { get; set; } = "Activo";

        /// <summary>Teléfono del dueño del vehículo (opcional). Si se proporciona, se envía recibo por WhatsApp al salir.</summary>
        [MaxLength(20)]
        public string? TelefonoContacto { get; set; }
    }
}