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
        // ==========================================
        [HttpPost("registrar")]
        public async Task<IActionResult> Registrar(RegistroRequest request)
        {
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
            // 1. Buscamos al usuario por correo
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Correo == request.Correo);
            if (usuario == null) return Unauthorized("Correo o contraseña incorrectos.");

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
    }

    // ==========================================
    // CLASES AUXILIARES (DTOs) PARA RECIBIR DATOS
    // ==========================================
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
}