namespace SaaSERP.Api.Models
{
    public class Recurso
    {
        public int Id { get; set; }
        public int NegocioId { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Tipo { get; set; } = "Empleado"; // "Empleado", "Espacio", "Activo"
        public bool Activo { get; set; } = true;
    }
}
