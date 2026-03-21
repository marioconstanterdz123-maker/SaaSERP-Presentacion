namespace SaaSERP.Api.Models
{
    public class DetalleComanda
    {
        public int Id { get; set; }
        public int ComandaId { get; set; }
        public int ServicioId { get; set; } // O ProductoId
        public int Cantidad { get; set; }
        public decimal Subtotal { get; set; }
        public string NotasOpcionales { get; set; } = string.Empty;
    }
}
