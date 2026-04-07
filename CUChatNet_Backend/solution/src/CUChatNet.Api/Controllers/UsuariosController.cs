using CUChatNet.Api.Data;
using CUChatNet.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CUChatNet.Api.Dtos;

namespace CUChatNet.Api.Controllers;

[ApiController]
[Route("api/usuarios")]
public class UsuariosController : ControllerBase
{
    private readonly CUChatNetDbContext _db;

    public UsuariosController(CUChatNetDbContext db)
    {
        _db = db;
    }

    // ===============================
    // 🔹 OBTENER TODOS
    // ===============================
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var usuarios = await _db.Usuarios
            .Where(u => !u.Eliminado)
            .Select(u => new
            {
                u.UsuarioId,
                u.Nombre,
                Telefono = u.ExtensionPais + u.NumeroTelefono,
                u.EstadoPerfil,
                u.Descripcion,
                u.Activo
            })
            .ToListAsync();

        return Ok(usuarios);
    }

    // ===============================
    // 🔹 OBTENER POR ID
    // ===============================
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(long id)
    {
        var user = await _db.Usuarios
            .Where(u => u.UsuarioId == id && !u.Eliminado)
            .Select(u => new
            {
                u.UsuarioId,
                u.Nombre,
                Telefono = u.ExtensionPais + u.NumeroTelefono,
                u.EstadoPerfil,
                u.Descripcion,
                u.Activo
            })
            .FirstOrDefaultAsync();

        if (user == null)
            return NotFound();

        return Ok(user);
    }

    // ===============================
    // 🔹 ACTUALIZAR PERFIL
    // ===============================
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateUserRequest request)
    {
        var user = await _db.Usuarios.FindAsync(id);

        if (user == null || user.Eliminado)
            return NotFound();

        // ✅ Nombre
        if (!string.IsNullOrWhiteSpace(request.Name))
            user.Nombre = request.Name;

        // ✅ Estado CONTROLADO (NO romper CHECK)
        var estadosValidos = new[] { "available", "away", "busy", "offline" };

        if (!string.IsNullOrWhiteSpace(request.Status) &&
            estadosValidos.Contains(request.Status))
        {
            user.EstadoPerfil = request.Status;
        }

        // ✅ Descripción (esto es lo que tú querías poner largo)
        if (!string.IsNullOrWhiteSpace(request.Description))
            user.Descripcion = request.Description;

        await _db.SaveChangesAsync();

        return Ok(new { message = "Usuario actualizado correctamente" });
    }

    // ===============================
    // 🔹 ELIMINAR (LÓGICO)
    // ===============================
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(long id)
    {
        var user = await _db.Usuarios.FindAsync(id);

        if (user == null)
            return NotFound();

        user.Eliminado = true;

        await _db.SaveChangesAsync();

        return Ok(new { message = "Usuario eliminado" });
    }

    // ===============================
    // 🔹 CREAR USUARIO (FIX TOTAL)
    // ===============================
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpdateUserRequest request)
    {
        // ✅ SIEMPRE estado válido
        var estado = "available";

        var user = new Usuario
        {
            Nombre = string.IsNullOrWhiteSpace(request.Name)
                ? "Usuario"
                : request.Name,

            EstadoPerfil = estado,

            Descripcion = request.Description ?? "",

            ExtensionPais = "+506",
            NumeroTelefono = Guid.NewGuid().ToString().Substring(0, 8),

            Activo = true,
            Eliminado = false,
            Verificado = true,

            FechaCreacion = DateTime.UtcNow
        };

        _db.Usuarios.Add(user);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            user.UsuarioId,
            user.Nombre,
            user.EstadoPerfil,
            user.Descripcion
        });
    }
}