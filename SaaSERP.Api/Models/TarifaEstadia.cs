namespace SaaSERP.Api.Models
{
    public class TarifaEstadia
    {
        public int Id { get; set; }
        public int NegocioId { get; set; }
        
        // Matemáticas del Parqueadero en México
        public decimal CostoPrimeraFraccion { get; set; } = 20.00m; // Costo por entrar/primera hora
        public int MinutosPrimeraFraccion { get; set; } = 60; // Hasta que minuto abarca el cobro inicial
        
        public decimal CostoFraccionAdicional { get; set; } = 5.00m; // A partir de la primera, cuanto se cobra
        public int MinutosFraccionAdicional { get; set; } = 15; // Bloque de cobro extra (15 mins, 60 mins etc)
        
        public int MinutosToleranciaEntrada { get; set; } = 5; // Si sale antes de esto, $0
        public int MinutosToleranciaFraccion { get; set; } = 5; // Tolerancia para que brincare al sig bloque
        
        public decimal BoletoPerdido { get; set; } = 150.00m;

        // Estructura futura para impresión
        public string HeaderTicket { get; set; } = "PARQUEADERO SAAS";
        public string FooterTicket { get; set; } = "CONSERVE ESTE BOLETO. Gracias por su preferencia.";
    }
}
