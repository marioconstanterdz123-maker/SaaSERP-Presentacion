using Microsoft.EntityFrameworkCore;

namespace SaaSERP.Api.Models
{
    [Keyless]
    public class KpiComandaActiva
    {
        public int NegocioId { get; set; }
        public string Negocio { get; set; } = string.Empty;
        public int TotalOrdenesActivas { get; set; }
        public decimal DineroEnCurso { get; set; }
    }

    [Keyless]
    public class KpiEstadiaActiva
    {
        public int NegocioId { get; set; }
        public string Negocio { get; set; } = string.Empty;
        public int VehiculosAdentro { get; set; }
        public int MinutosTotalesEstacionados { get; set; }
    }
}
