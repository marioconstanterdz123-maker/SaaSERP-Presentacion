using Microsoft.AspNetCore.Mvc;

namespace SaaSERP.Api.Controllers.Web
{
    /// <summary>
    /// Controlador MVC para la zona SuperAdmin.
    /// Los datos se cargan en el cliente vía fetch() al API JSON.
    /// </summary>
    public class WebAdminController : Controller
    {
        // GET /web/WebAdmin/Dashboard
        public IActionResult Dashboard() => View();

        // GET /web/WebAdmin/Negocios
        public IActionResult Negocios() => View();

        // GET /web/WebAdmin/Usuarios
        public IActionResult Usuarios() => View();

        // GET /web/WebAdmin/Configuracion
        public IActionResult Configuracion() => View();

        // GET /web/WebAdmin/Papelera
        public IActionResult Papelera() => View();
    }
}
