namespace CUChatNet.Api.Models;

public class PreferenciasUsuario
{
    public int PreferenciaId { get; set; }
    public long UsuarioId { get; set; }

    public bool FotoPerfilVisible { get; set; }
    public bool EstadoVisible { get; set; }
    public bool UltimaVezVisible { get; set; }
    public bool ConfirmacionesLectura { get; set; }

    public bool NotificacionesEmail { get; set; }
    public bool NotificacionesPush { get; set; }
    public bool SonidoNotificaciones { get; set; }

    public DateTime FechaActualizacion { get; set; }

    public Usuario Usuario { get; set; } = null!;
}