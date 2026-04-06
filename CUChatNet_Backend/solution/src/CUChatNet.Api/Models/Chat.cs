using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CUChatNet.Api.Models;

public class Chat
{
    [Key] // 🔥 IMPORTANTE para evitar errores raros
    public long ChatId { get; set; }

    public string? Nombre { get; set; } // 👈 opcional (para grupo)
    public bool EsGrupo { get; set; }

    public bool Activo { get; set; } = true;

    // 🔥 Relaciones
    public ICollection<ChatUsuario> ChatUsuarios { get; set; } = new List<ChatUsuario>();
    public ICollection<Mensaje> Mensajes { get; set; } = new List<Mensaje>();
    public ICollection<ChatParticipante> Participantes { get; set; } = new List<ChatParticipante>();

    // 🔥 Extras (no obligatorios)
    public string? CodigoConversacion { get; set; }
    public string? TipoChat { get; set; }
    public string? FotoUrl { get; set; }
    public long? CreadoPorUsuarioId { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow; // 👈 evita nulls

    public string? Descripcion { get; set; }
}