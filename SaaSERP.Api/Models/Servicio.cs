namespace SaaSERP.Api.Models
{
    public class Servicio
    {
        public int Id { get; set; }
        public int NegocioId { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public int DuracionMinutos { get; set; }
        public decimal Precio { get; set; }
        public bool Activo { get; set; } = true;
    }
}
