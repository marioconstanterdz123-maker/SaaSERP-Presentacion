using Microsoft.AspNetCore.Mvc;

namespace SaaSERP.Api.Controllers.Web
{
    /// <summary>
    /// Controlador MVC para la zona Tenant (por negocio).
    /// La ruta es: /web/negocio/{negocioId}/{action}
    /// Los datos se cargan en el cliente vía fetch() al API JSON.
    /// </summary>
    public class WebNegocioController : Controller
    {
        // GET /web/negocio/{negocioId}/Dashboard
        public IActionResult Dashboard(int negocioId)
        {
            ViewBag.NegocioId = negocioId;
            return View();
        }

        // GET /web/negocio/{negocioId}/POS
        public IActionResult POS(int negocioId)
        {
            ViewBag.NegocioId = negocioId;
            return View();
        }

        // GET /web/negocio/{negocioId}/Catalogos
        public IActionResult Catalogos(int negocioId)
        {
            ViewBag.NegocioId = negocioId;
            return View();
        }

        // GET /web/negocio/{negocioId}/Recursos
        public IActionResult Recursos(int negocioId)
        {
            ViewBag.NegocioId = negocioId;
            return View();
        }

        // GET /web/negocio/{negocioId}/Citas
        public IActionResult Citas(int negocioId)
        {
            ViewBag.NegocioId = negocioId;
            return View();
        }

        // GET /web/negocio/{negocioId}/Historial
        public IActionResult Historial(int negocioId)
        {
            ViewBag.NegocioId = negocioId;
            return View();
        }

        // GET /web/negocio/{negocioId}/Operacion
        public IActionResult Operacion(int negocioId)
        {
            ViewBag.NegocioId = negocioId;
            return View();
        }

        // GET /web/negocio/{negocioId}/Trabajadores
        public IActionResult Trabajadores(int negocioId)
        {
            ViewBag.NegocioId = negocioId;
            return View();
        }

        // GET /web/negocio/{negocioId}/CRM
        public IActionResult CRM(int negocioId)
        {
            ViewBag.NegocioId = negocioId;
            return View();
        }

        // GET /web/negocio/{negocioId}/Lealtad
        public IActionResult Lealtad(int negocioId)
        {
            ViewBag.NegocioId = negocioId;
            return View();
        }

        // GET /web/negocio/{negocioId}/WhatsApp
        public IActionResult WhatsApp(int negocioId)
        {
            ViewBag.NegocioId = negocioId;
            return View();
        }

        // GET /web/negocio/{negocioId}/Ajustes
        public IActionResult Ajustes(int negocioId)
        {
            ViewBag.NegocioId = negocioId;
            return View();
        }
    }
}
