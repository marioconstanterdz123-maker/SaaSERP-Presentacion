using System;

namespace SaaSERP.Api.Models
{
    public class Estadia
    {
        public int Id { get; set; }
        public int NegocioId { get; set; }
        public string PlacaOIdentificador { get; set; } = string.Empty;
        
        public DateTime FechaHoraEntrada { get; set; }
        public DateTime? FechaHoraSalida { get; set; }
        
        public decimal MontoTotal { get; set; }
        public string Estado { get; set; } = "En Curso"; // "En Curso", "Pagado", "Cancelado"
        public string Notas { get; set; } = string.Empty;
    }
}
