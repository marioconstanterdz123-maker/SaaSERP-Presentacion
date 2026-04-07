using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SaaSERP.Api.Models
{
    /// <summary>
    /// Tabla puente N:M que permite asignar múltiples negocios a un mismo usuario.
    /// Complementa el NegocioId "primario" que ya existe en Usuario.
    /// </summary>
    public class UsuarioNegocio
    {
        [Key]
        public int Id { get; set; }

        public int UsuarioId { get; set; }
        [ForeignKey("UsuarioId")]
        public Usuario? Usuario { get; set; }

        public int NegocioId { get; set; }
        [ForeignKey("NegocioId")]
        public Negocio? Negocio { get; set; }

        /// <summary>Rol que el usuario desempeña en este negocio específico.</summary>
        [MaxLength(50)]
        public string Rol { get; set; } = "AdminNegocio";
    }
}
