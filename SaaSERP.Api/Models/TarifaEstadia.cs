using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SaaSERP.Api.Models
{
    [Table("TarifaEstadia", Schema = "Core")]
    public class TarifaEstadia
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int NegocioId { get; set; }

        public decimal CostoPrimeraFraccion { get; set; } = 20.00m;
        public int MinutosPrimeraFraccion { get; set; } = 60;
        
        public decimal CostoFraccionAdicional { get; set; } = 5.00m;
        public int MinutosFraccionAdicional { get; set; } = 15;
        
        public int MinutosToleranciaEntrada { get; set; } = 10;
        public int MinutosToleranciaFraccion { get; set; } = 5;
        
        public decimal BoletoPerdido { get; set; } = 150.00m;
        
        [MaxLength(200)]
        public string HeaderTicket { get; set; } = "PARQUEADERO";
        
        [MaxLength(200)]
        public string FooterTicket { get; set; } = "Gracias por su visita.";

        public Negocio? Negocio { get; set; }
    }
}
