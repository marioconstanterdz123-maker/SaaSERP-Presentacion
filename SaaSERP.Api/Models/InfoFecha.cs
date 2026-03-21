using System;

namespace SaaSERP.Api.Models
{
    public class InfoFecha
    {
        public string FechaCompleta { get; set; } = string.Empty;
        public string DiaSemana { get; set; } = string.Empty;
        public int Anio { get; set; }
        public int Mes { get; set; }
        public int Dia { get; set; }
        public string HoraExacta { get; set; } = string.Empty;
    }
}
