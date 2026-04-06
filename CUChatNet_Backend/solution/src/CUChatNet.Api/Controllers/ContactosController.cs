using CUChatNet.Api.Data;
using CUChatNet.Api.Dtos;
using CUChatNet.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/contactos")]
public class ContactosController : ControllerBase
{
    private readonly CUChatNetDbContext _db;

    public ContactosController(CUChatNetDbContext db)
    {
        _db = db;
    }

    // ?? Agregar contacto
    [HttpPost]
    public async Task<IActionResult> AddContact([FromBody] AddContactRequest request)
    {
        // Validar usuario
        var user = await _db.Usuarios.FindAsync(request.UserId);
        if (user == null)
            return NotFound("Usuario no existe");

        // Validar contacto
        var contactUser = await _db.Usuarios.FindAsync(request.ContactUserId);
        if (contactUser == null)
            return NotFound("El usuario que quieres agregar no existe");

        // ? Evitar agregarse a sí mismo
        if (request.UserId == request.ContactUserId)
            return BadRequest("No puedes agregarte a ti mismo");

        // Evitar duplicados
        var exists = await _db.ContactosUsuario.AnyAsync(c =>
            c.UsuarioId == request.UserId &&
            c.ContactoUsuarioId == request.ContactUserId);

        if (exists)
            return BadRequest("Ya tienes este contacto");

        // Crear contacto
        var nuevo = new ContactoUsuario
        {
            UsuarioId = request.UserId,
            ContactoUsuarioId = request.ContactUserId
        };

        _db.ContactosUsuario.Add(nuevo);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Contacto agregado correctamente" });
    }

    // ?? Listar contactos
    [HttpGet("{userId}")]
    public async Task<IActionResult> GetContacts(long userId)
    {
        var contactos = await _db.ContactosUsuario
            .Where(c => c.UsuarioId == userId)
            .Include(c => c.Contacto)
            .Select(c => new ContactDto(
                c.Contacto.UsuarioId,
                c.Contacto.Nombre,
                c.Contacto.ExtensionPais + c.Contacto.NumeroTelefono,
                null, // ? No tienes FotoPerfil
                null, // ? No tienes DescripcionPerfil
                c.Contacto.EstadoPerfil,
                true // ? No tienes FromAgenda en BD (lo simulamos)
            ))
            .ToListAsync();

        return Ok(contactos);
    }
}