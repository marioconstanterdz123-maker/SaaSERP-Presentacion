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
        public TimeSpan HoraApertura { get; set; } = TimeSpan.Zero;
        public TimeSpan HoraCierre { get; set; } = TimeSpan.Zero;

        /// <summary>Nombre de la instancia registrada en EvolutionAPI para este negocio.</summary>
        [MaxLength(100)]
        public string? InstanciaWhatsApp { get; set; }

        // ─── Feature Flags (Controlados por SuperAdmin) ───────────────────────
        /// <summary>El negocio puede iniciar sesión y usar el panel web.</summary>
        public bool AccesoWeb { get; set; } = true;

        /// <summary>El negocio puede usar la app móvil (futuro).</summary>
        public bool AccesoMovil { get; set; } = false;

        /// <summary>Tiene acceso a la sección Historial.</summary>
        public bool ModuloHistorial { get; set; } = true;

        /// <summary>Mensajes automáticos por WhatsApp habilitados.</summary>
        public bool ModuloWhatsApp { get; set; } = false;

        /// <summary>Analítica avanzada y gráficos habilitados.</summary>
        public bool ModuloReportes { get; set; } = true;

        [MaxLength(255)]
        public string? MercadoPagoAccessToken { get; set; }

        /// <summary>Minutos de inactividad antes de reactivar la IA automáticamente (default 60)</summary>
        public int TiempoSilencioMinutos { get; set; } = 60;
    }
}
