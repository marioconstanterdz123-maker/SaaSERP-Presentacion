using Microsoft.AspNetCore.Mvc;

namespace SaaSERP.Api.Controllers.Web
{
    /// <summary>
    /// Controlador MVC que sirve las páginas web de autenticación.
    /// Las credenciales se validan en el frontend contra /Auth/login (API JSON).
    /// </summary>
    public class WebAuthController : Controller
    {
        // GET /web/
        // GET /web/WebAuth/Login
        public IActionResult Login()
        {
            return View();
        }
    }
}
