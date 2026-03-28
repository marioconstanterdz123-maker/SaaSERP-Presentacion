using System.ComponentModel.DataAnnotations;

namespace SaaSERP.Api.Models
{
    /// <summary>Regla de lealtad configurable por negocio. 
    /// Ejemplo: "3 citas en 6 meses = nivel VIP con 10% de descuento"</summary>
    public class ReglaBonificacion
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int NegocioId { get; set; }

        [Required, MaxLength(100)]
        public string Nombre { get; set; } = string.Empty;

        /// <summary>Número de citas completadas necesarias para activar la regla</summary>
        [Required]
        public int CitasRequeridas { get; set; }

        /// <summary>Ventana de tiempo en meses (ej: 6 = últimos 6 meses)</summary>
        [Required]
        public int VentanaMeses { get; set; }

        /// <summary>Etiqueta de nivel que se asigna al cliente (ej: "VIP", "Premium")</summary>
        [Required, MaxLength(50)]
        public string NivelNombre { get; set; } = string.Empty;

        /// <summary>Descuento en porcentaje (ej: 10.00 = 10%)</summary>
        public decimal Descuento { get; set; } = 0;

        public bool Activa { get; set; } = true;
    }
}
