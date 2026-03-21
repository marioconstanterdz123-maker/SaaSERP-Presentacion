using SaaSERP.Api.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SaaSERP.Api.Services
{
    public interface ICitaService
    {
        Task<bool> ValidarDisponibilidadAsync(int negocioId, DateTime fechaHoraInicio, DateTime fechaHoraFin, int? recursoId = null);
        Task<int> RegistrarCitaAsync(Cita cita);
        Task<IEnumerable<Cita>> ObtenerCitasPorTelefonoAsync(int negocioId, string telefonoCliente);
        Task<bool> CancelarCitaAsync(int citaId);
        Task<bool> ReprogramarCitaAsync(int citaId, DateTime nuevaFechaInicio, DateTime nuevaFechaFin);
    }
}
