using CUChatNet.Api.Data;
using CUChatNet.Api.Dtos;
using CUChatNet.Api.Models;
 // Importante para el Hub
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR; // Importante para SignalR

namespace CUChatNet.Api.Controllers;

[ApiController]
[Route("api")]
public class MessagesController : ControllerBase
{
    private readonly CUChatNetDbContext _db;
    private readonly IHubContext<ChatHub> _hubContext; // 🔥 Inyección del Hub

    public MessagesController(CUChatNetDbContext db, IHubContext<ChatHub> hubContext)
    {
        _db = db;
        _hubContext = hubContext;
    }

    [HttpGet("chats/{chatId:long}/messages")]
    public async Task<ActionResult<IEnumerable<MessageDto>>> GetMessages(long chatId, [FromQuery] long? userId = null)
    {
        var messages = await _db.Mensajes
            .Where(m => m.ChatId == chatId)
            .Include(m => m.RemitenteUsuario)
            .Include(m => m.Adjuntos)
            .Include(m => m.Estados)
            .OrderBy(m => m.FechaEnvio)
            .ToListAsync();

        var result = messages.Select(m =>
        {
            var userState = userId.HasValue
                ? m.Estados.FirstOrDefault(e => e.UsuarioId == userId.Value)
                : null;

            return new MessageDto(
                m.MensajeId,
                m.ChatId,
                m.RemitenteUsuarioId,
                m.RemitenteUsuario.Nombre,
                m.Contenido ?? "",
                m.FechaEnvio,
                userState?.Estado ?? (m.EstadoServidor == "sent" ? "sent" : m.EstadoServidor),
                m.Encriptado,
                m.Editado,
                userState?.EliminadoParaMi ?? false,
                m.EliminadoParaTodos,
                m.TipoMensaje,
                m.Adjuntos.FirstOrDefault()?.UrlArchivo
            );
        });

        return Ok(result);
    }

    [HttpPost("chats/{chatId:long}/messages")]
    public async Task<IActionResult> SendMessage(long chatId, [FromBody] SendMessageRequest request)
    {
        var chat = await _db.Chats
            .Include(c => c.Participantes)
            .FirstOrDefaultAsync(c => c.ChatId == chatId && c.Activo);

        if (chat is null)
            return NotFound(new { error = "Chat no encontrado." });

        var sender = await _db.Usuarios.FirstOrDefaultAsync(u => u.UsuarioId == request.SenderId && !u.Eliminado);
        if (sender is null)
            return BadRequest(new { error = "Remitente no válido." });

        // 1. Crear el objeto del mensaje
        var message = new Mensaje
        {
            ChatId = chatId,
            RemitenteUsuarioId = request.SenderId,
            TipoMensaje = request.Type,
            Contenido = request.Content,
            Encriptado = true,
            Editado = false,
            EliminadoParaTodos = false,
            EstadoServidor = "sent",
            IpOrigen = HttpContext.Connection.RemoteIpAddress?.ToString(),
            FechaEnvio = DateTime.UtcNow
        };

        _db.Mensajes.Add(message);
        await _db.SaveChangesAsync(); // Guardamos para obtener el ID

        // 2. Manejo de adjuntos
        if (!string.IsNullOrWhiteSpace(request.MediaUrl) && request.Type != "text")
        {
            _db.MensajeAdjuntos.Add(new MensajeAdjunto
            {
                MensajeId = message.MensajeId,
                TipoAdjunto = request.Type,
                UrlArchivo = request.MediaUrl,
                NombreArchivo = request.FileName,
                MimeType = request.MimeType,
                TamanoBytes = request.SizeBytes,
                DuracionSegundos = request.DurationSeconds,
                FechaCreacion = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();
        }

        // 3. Crear estados para los receptores
        var receivers = chat.Participantes
            .Where(p => p.Activo && p.UsuarioId != request.SenderId)
            .ToList();

        foreach (var receiver in receivers)
        {
            _db.MensajeEstados.Add(new MensajeEstado
            {
                MensajeId = message.MensajeId,
                UsuarioId = receiver.UsuarioId,
                Estado = "received",
                FechaEntrega = DateTime.UtcNow,
                EliminadoParaMi = false
            });
        }

        // 4. Bitácora
        _db.BitacoraEventos.Add(new BitacoraEvento
        {
            Categoria = "message",
            UsuarioId = request.SenderId,
            Accion = "Mensaje enviado",
            Detalles = $"ChatID: {chatId}, Tipo: {request.Type}",
            Severidad = "info",
            DireccionIp = HttpContext.Connection.RemoteIpAddress?.ToString(),
            FechaEvento = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        // 5. 🔥 ESTRUCTURA PARA EL TIEMPO REAL (SIGNALR)
        var messageData = new
        {
            id = message.MensajeId,
            chatId = message.ChatId,
            senderId = message.RemitenteUsuarioId,
            senderName = sender.Nombre,
            content = message.Contenido,
            timestamp = message.FechaEnvio,
            status = "sent",
            encrypted = message.Encriptado,
            edited = message.Editado,
            deletedForMe = false,
            deletedForAll = message.EliminadoParaTodos,
            type = message.TipoMensaje,
            mediaUrl = request.MediaUrl
        };

        // 🔥 NOTIFICAR A SIGNALR: Enviamos el mensaje al grupo del ChatId
        await _hubContext.Clients.Group(chatId.ToString()).SendAsync("ReceiveMessage", messageData);

        return Ok(messageData);
    }

    [HttpPatch("messages/{messageId:long}/status")]
    public async Task<IActionResult> UpdateStatus(long messageId, [FromBody] UpdateMessageStatusRequest request)
    {
        var state = await _db.MensajeEstados
            .FirstOrDefaultAsync(x => x.MensajeId == messageId && x.UsuarioId == request.UserId);

        if (state is null)
            return NotFound(new { error = "Estado de mensaje no encontrado." });

        state.Estado = request.Status;

        if (request.Status == "received" && state.FechaEntrega is null)
            state.FechaEntrega = DateTime.UtcNow;

        if (request.Status == "seen")
            state.FechaVista = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new { success = true });
    }
    // Añade este método a tu MessagesController.cs

    [HttpPatch("chats/{chatId:long}/read")]
    public async Task<IActionResult> MarkChatAsRead(long chatId, [FromQuery] long userId)
    {
        // Buscamos todos los estados de mensajes en este chat que pertenecen al usuario 
        // y que aún no han sido leídos ('seen')
        var unreadStates = await _db.MensajeEstados
            .Include(e => e.Mensaje)
            .Where(e => e.Mensaje.ChatId == chatId &&
                        e.UsuarioId == userId &&
                        e.Estado != "seen")
            .ToListAsync();

        if (!unreadStates.Any()) return Ok(new { message = "Sin mensajes pendientes" });

        foreach (var state in unreadStates)
        {
            state.Estado = "seen";
            state.FechaVista = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        // 🔥 Notificamos por SignalR a los demás en el chat que sus mensajes fueron leídos
        await _hubContext.Clients.Group(chatId.ToString()).SendAsync("ChatReadByPeer", userId);

        return Ok(new { success = true, count = unreadStates.Count });
    }
}