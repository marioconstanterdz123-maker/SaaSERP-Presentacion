using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SaaSERP.Api.Data;
using SaaSERP.Api.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SaaSERP.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    
    public class AuthController : ControllerBase
    {
        private readonly SaaSContext _context;
        private readonly IConfiguration _config;

        public AuthController(SaaSContext context, IConfiguration config)
        {
            _context = context;
            _config = config; // Necesitamos esto para leer tu llave secreta del appsettings.json
        }

        // ==========================================
        // 1. REGISTRAR UN NUEVO USUARIO/EMPLEADO
        //    SuperAdmin puede crear en cualquier negocio, AdminNegocio solo en el suyo.
        // ==========================================
        [Authorize(Roles = "SuperAdmin,AdminNegocio")]
        [HttpPost("registrar")]
        public async Task<IActionResult> Registrar(RegistroRequest request)
        {
            var userRole = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;
            var userNegocioIdStr = User.Claims.FirstOrDefault(c => c.Type == "NegocioId")?.Value;
            int? userNegocioId = string.IsNullOrEmpty(userNegocioIdStr) ? null : int.Parse(userNegocioIdStr);

            if (userRole == "AdminNegocio")
            {
                // Forzar que el AdminNegocio solo cree usuarios en su propio negocio
                request.NegocioId = userNegocioId;
                if (request.Rol == "SuperAdmin") return Forbid("No puede crear un SuperAdmin.");
            }

            // 1. Verificamos que el correo no exista ya
            var existe = await _context.Usuarios.AnyAsync(u => u.Correo == request.Correo);
            if (existe) return BadRequest("El correo ya está registrado.");

            // 2. Creamos el usuario y ENCRIPTAMOS la contraseña usando BCrypt
            var nuevoUsuario = new Usuario
            {
                Nombre = request.Nombre,
                Correo = request.Correo,
                NegocioId = request.NegocioId,
                Rol = request.Rol,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password) // Magia de seguridad aquí
            };

            _context.Usuarios.Add(nuevoUsuario);
            await _context.SaveChangesAsync();

            return Ok(new { Mensaje = "Usuario registrado con éxito." });
        }

        // ==========================================
        // 2. INICIAR SESIÓN (LOGIN) Y GENERAR TOKEN
        // ==========================================
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            // 1. Buscamos al usuario por correo e incluimos el negocio
            var usuario = await _context.Usuarios
                .Include(u => u.Negocio)
                .FirstOrDefaultAsync(u => u.Correo == request.Correo);

            if (usuario == null) return Unauthorized("Correo o contraseña incorrectos.");

            // 1.5. Verificar Acceso según plataforma
            var platform = Request.Headers["X-Platform"].FirstOrDefault() ?? "web";
            if (usuario.Rol != "SuperAdmin" && usuario.Negocio != null)
            {
                if (platform == "web" && !usuario.Negocio.AccesoWeb)
                    return Unauthorized("Su negocio tiene el acceso web deshabilitado. Contacte a soporte.");
                if (platform == "mobile" && !usuario.Negocio.AccesoMovil)
                    return Unauthorized("Su negocio tiene el acceso móvil deshabilitado. Contacte a soporte.");
            }

            // 2. Verificamos que la contraseña coincida con el Hash
            bool passwordCorrecto = BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash);
            if (!passwordCorrecto) return Unauthorized("Correo o contraseña incorrectos.");

            // 3. ¡Si todo está bien, fabricamos el Token JWT!
            var jwt = GenerarTokenJWT(usuario);

            // Devolvemos el token al cliente (Flutter, React o n8n)
            return Ok(new { Token = jwt });
        }

        // ==========================================
        // MÉTODO PRIVADO: FABRICAR EL TOKEN
        // ==========================================
        private string GenerarTokenJWT(Usuario usuario)
        {
            // Aquí inyectamos los datos invisibles dentro del token
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                new Claim(ClaimTypes.Email, usuario.Correo),
                new Claim(ClaimTypes.Role, usuario.Rol),
                // ESTA ES LA CLAVE DEL SAAS: Metemos el ID del Negocio en el token
                new Claim("NegocioId", usuario.NegocioId?.ToString() ?? "0")
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7), // El token dura 7 días sin pedir login
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // ==========================================
        // 3. LISTAR TODOS LOS USUARIOS
        // ==========================================
        [Authorize(Roles = "SuperAdmin,AdminNegocio")]
        [HttpGet("usuarios")]
        public async Task<IActionResult> ListarUsuarios()
        {
            var userRole = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;
            var userNegocioIdStr = User.Claims.FirstOrDefault(c => c.Type == "NegocioId")?.Value;
            int? userNegocioId = string.IsNullOrEmpty(userNegocioIdStr) ? null : int.Parse(userNegocioIdStr);

            var query = _context.Usuarios.AsQueryable();

            if (userRole == "AdminNegocio")
            {
                query = query.Where(u => u.NegocioId == userNegocioId);
            }

            var usuarios = await query
                .Select(u => new {
                    u.Id,
                    u.Nombre,
                    u.Correo,
                    u.Rol,
                    u.NegocioId,
                    NegocioNombre = u.Negocio != null ? u.Negocio.Nombre : null
                })
                .OrderBy(u => u.NegocioId)
                .ThenBy(u => u.Nombre)
                .ToListAsync();

            return Ok(usuarios);
        }

        // ==========================================
        // 4. ELIMINAR USUARIO
        // ==========================================
        [Authorize(Roles = "SuperAdmin,AdminNegocio")]
        [HttpDelete("usuarios/{id}")]
        public async Task<IActionResult> EliminarUsuario(int id)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null) return NotFound(new { error = "Usuario no encontrado." });

            var userRole = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;
            var userNegocioIdStr = User.Claims.FirstOrDefault(c => c.Type == "NegocioId")?.Value;
            int? userNegocioId = string.IsNullOrEmpty(userNegocioIdStr) ? null : int.Parse(userNegocioIdStr);

            if (userRole == "AdminNegocio" && usuario.NegocioId != userNegocioId)
            {
                return Forbid("No puede eliminar un usuario de otro negocio.");
            }

            _context.Usuarios.Remove(usuario);
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Usuario eliminado correctamente." });
        }

        // ==========================================
        // 5. CAMBIAR ROL DE USUARIO
        // ==========================================
        [Authorize(Roles = "SuperAdmin,AdminNegocio")]
        [HttpPut("usuarios/{id}/rol")]
        public async Task<IActionResult> CambiarRolUsuario(int id, [FromBody] CambiarRolRequest request)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null) return NotFound(new { error = "Usuario no encontrado." });

            var userRole = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;
            var userNegocioIdStr = User.Claims.FirstOrDefault(c => c.Type == "NegocioId")?.Value;
            int? userNegocioId = string.IsNullOrEmpty(userNegocioIdStr) ? null : int.Parse(userNegocioIdStr);

            if (userRole == "AdminNegocio")
            {
                if (usuario.NegocioId != userNegocioId) return Forbid("No puede modificar un usuario de otro negocio.");
                if (request.Rol == "SuperAdmin") return Forbid("No puede asignar el rol de SuperAdmin.");
            }

            usuario.Rol = request.Rol;
            await _context.SaveChangesAsync();
            return Ok(new { mensaje = "Rol actualizado correctamente." });
        }

    // ==========================================
    // CLASES AUXILIARES (DTOs) PARA RECIBIR DATOS
    // ==========================================
    } // end AuthController

    public class RegistroRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public int? NegocioId { get; set; }
        public string Rol { get; set; } = "Operativo";
    }

    public class LoginRequest
    {
        public string Correo { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class CambiarRolRequest
    {
        public string Rol { get; set; } = string.Empty;
    }
}