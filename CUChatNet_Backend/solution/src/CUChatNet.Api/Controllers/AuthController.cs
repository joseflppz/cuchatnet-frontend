using CUChatNet.Api.Data;
using CUChatNet.Api.Dtos;
using CUChatNet.Api.Helpers;
using CUChatNet.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CUChatNet.Api.Controllers;

[ApiController]
[Route("api")]
public class AuthController : ControllerBase
{
    private readonly CUChatNetDbContext _db;
    private readonly IConfiguration _configuration;

    public AuthController(CUChatNetDbContext db, IConfiguration configuration)
    {
        _db = db;
        _configuration = configuration;
    }

    [HttpPost("verify/send")]
    public async Task<IActionResult> SendCode([FromBody] SendVerificationRequest request)
    {
        try
        {
            var defaultCountry = _configuration["Verification:DefaultCountryCode"] ?? "+506";
            var codeLength = int.TryParse(_configuration["Verification:CodeLength"], out var len) ? len : 6;
            var minutes = int.TryParse(_configuration["Verification:MinutesToExpire"], out var mins) ? mins : 10;
            var exposeCode = bool.TryParse(_configuration["Verification:ExposeCodeInResponse"], out var expose) && expose;

            var (countryCode, number, fullPhone) = PhoneHelper.Parse(request.Phone, defaultCountry);
            var code = PhoneHelper.GenerateVerificationCode(codeLength);

            var existingUser = await _db.Usuarios.FirstOrDefaultAsync(x =>
                x.ExtensionPais == countryCode && x.NumeroTelefono == number && !x.Eliminado);

            var verification = new VerificacionSms
            {
                UsuarioId = existingUser?.UsuarioId,
                ExtensionPais = countryCode,
                NumeroTelefono = number,
                Codigo = code,
                ProveedorSms = "Twilio",
                Estado = "pendiente",
                Intentos = 0,
                FechaCreacion = DateTime.UtcNow,
                FechaExpiracion = DateTime.UtcNow.AddMinutes(minutes)
            };

            _db.VerificacionesSms.Add(verification);
            _db.BitacoraEventos.Add(new BitacoraEvento
            {
                Categoria = "system",
                UsuarioId = existingUser?.UsuarioId,
                Accion = "Código SMS generado",
                Detalles = $"Teléfono: {fullPhone}",
                Severidad = "info",
                DireccionIp = HttpContext.Connection.RemoteIpAddress?.ToString(),
                FechaEvento = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();

            return Ok(new VerifyResponse(
                true,
                "Código generado correctamente.",
                existingUser is not null,
                null,
                exposeCode ? code : null
            ));
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("verify/check")]
    public async Task<IActionResult> CheckCode([FromBody] CheckVerificationRequest request)
    {
        try
        {
            var defaultCountry = _configuration["Verification:DefaultCountryCode"] ?? "+506";
            var (countryCode, number, fullPhone) = PhoneHelper.Parse(request.Phone, defaultCountry);

            var verification = await _db.VerificacionesSms
                .Where(x => x.ExtensionPais == countryCode
                         && x.NumeroTelefono == number
                         && x.Estado == "pendiente")
                .OrderByDescending(x => x.FechaCreacion)
                .FirstOrDefaultAsync();

            if (verification is null)
                return BadRequest(new { error = "No existe un código pendiente para ese teléfono." });

            if (verification.FechaExpiracion < DateTime.UtcNow)
            {
                verification.Estado = "expirado";
                await _db.SaveChangesAsync();
                return BadRequest(new { error = "El código ya expiró." });
            }

            verification.Intentos += 1;

            if (verification.Codigo != request.Code)
            {
                await _db.SaveChangesAsync();
                return BadRequest(new { error = "Código incorrecto." });
            }

            verification.Estado = "verificado";
            verification.FechaVerificacion = DateTime.UtcNow;

            var user = await _db.Usuarios.FirstOrDefaultAsync(x =>
                x.ExtensionPais == countryCode && x.NumeroTelefono == number && !x.Eliminado);

            if (user is not null)
            {
                user.Verificado = true;
                user.FechaUltimoAcceso = DateTime.UtcNow;
            }

            _db.BitacoraEventos.Add(new BitacoraEvento
            {
                Categoria = "security",
                UsuarioId = user?.UsuarioId,
                Accion = "Teléfono verificado",
                Detalles = $"Teléfono: {fullPhone}",
                Severidad = "info",
                DireccionIp = HttpContext.Connection.RemoteIpAddress?.ToString(),
                FechaEvento = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();

            AuthUserDto? userDto = null;
            if (user is not null)
            {
                userDto = new AuthUserDto(
                    user.UsuarioId,
                    $"{user.ExtensionPais}{user.NumeroTelefono}",
                    user.Nombre,
                    user.FotoUrl,
                    user.Descripcion,
                    user.EstadoPerfil,
                    user.FechaCreacion,
                    user.Activo
                );
            }

            return Ok(new VerifyResponse(
                true,
                "Código verificado correctamente.",
                user is not null,
                userDto
            ));
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("auth/profile-setup")]
    public async Task<IActionResult> SetupProfile([FromBody] SetupProfileRequest request)
    {
        try
        {
            var defaultCountry = _configuration["Verification:DefaultCountryCode"] ?? "+506";
            var (countryCode, number, _) = PhoneHelper.Parse(request.Phone, defaultCountry);

            var verified = await _db.VerificacionesSms
                .Where(x => x.ExtensionPais == countryCode
                         && x.NumeroTelefono == number
                         && x.Estado == "verificado")
                .OrderByDescending(x => x.FechaVerificacion)
                .FirstOrDefaultAsync();

            if (verified is null)
                return BadRequest(new { error = "Primero debes verificar el teléfono." });

            var user = await _db.Usuarios.FirstOrDefaultAsync(x =>
                x.ExtensionPais == countryCode && x.NumeroTelefono == number && !x.Eliminado);

            if (user is null)
            {
                user = new Usuario
                {
                    ExtensionPais = countryCode,
                    NumeroTelefono = number,
                    Nombre = request.Name.Trim(),
                    FotoUrl = request.PhotoUrl,
                    Descripcion = request.Description,
                    EstadoPerfil = string.IsNullOrWhiteSpace(request.Status) ? "available" : request.Status,
                    Verificado = true,
                    Activo = true,
                    Eliminado = false,
                    FechaCreacion = DateTime.UtcNow,
                    FechaUltimoAcceso = DateTime.UtcNow
                };

                _db.Usuarios.Add(user);
                await _db.SaveChangesAsync();

                var userRoleId = await _db.Roles
                    .Where(x => x.Codigo == "USER")
                    .Select(x => x.RolId)
                    .FirstOrDefaultAsync();

                if (userRoleId > 0)
                {
                    _db.UsuarioRoles.Add(new UsuarioRol
                    {
                        UsuarioId = user.UsuarioId,
                        RolId = userRoleId,
                        FechaAsignacion = DateTime.UtcNow
                    });
                }

                _db.CuentasAcceso.Add(new CuentaAcceso
                {
                    UsuarioId = user.UsuarioId,
                    NombreUsuario = $"{countryCode}{number}",
                    EstadoCuenta = "active",
                    UsaOtp = true,
                    DebeCambiarContrasena = false,
                    IntentosFallidos = 0,
                    Activo = true
                });
            }
            else
            {
                user.Nombre = request.Name.Trim();
                user.FotoUrl = request.PhotoUrl;
                user.Descripcion = request.Description;
                user.EstadoPerfil = string.IsNullOrWhiteSpace(request.Status) ? user.EstadoPerfil : request.Status;
                user.Verificado = true;
                user.Activo = true;
                user.FechaUltimoAcceso = DateTime.UtcNow;
            }

            _db.BitacoraEventos.Add(new BitacoraEvento
            {
                Categoria = "system",
                UsuarioId = user.UsuarioId,
                Accion = "Perfil configurado",
                Detalles = $"Usuario: {request.Name}",
                Severidad = "info",
                DireccionIp = HttpContext.Connection.RemoteIpAddress?.ToString(),
                FechaEvento = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();

            var response = new AuthUserDto(
                user.UsuarioId,
                $"{user.ExtensionPais}{user.NumeroTelefono}",
                user.Nombre,
                user.FotoUrl,
                user.Descripcion,
                user.EstadoPerfil,
                user.FechaCreacion,
                user.Activo
            );

            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
