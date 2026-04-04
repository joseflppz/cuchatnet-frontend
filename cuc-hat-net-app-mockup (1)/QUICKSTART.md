# CUChatNet - Guía Rápida

## Inicio Rápido

### 1. Vista Cliente (Usuario)

```
Landing → Ingresar como Usuario → Teléfono → SMS (123456) → Crear Perfil → Chat
```

**Credenciales Demo:**
- Cualquier número de teléfono funciona
- Código SMS: `123456`

**Tabs disponibles:**
- **Chats:** Mensajes individuales con burbujas, estados (✓/✓✓/✓✓), filtros
- **Grupos:** Lista de grupos con miembros y información
- **Contactos:** Lista A-Z con opción de iniciar chat
- **Estados:** Crear estados de texto de 24 horas, ver estados de otros
- **Ajustes:** Seguridad, privacidad, notificaciones

### 2. Vista Administrativa

```
Landing → Acceso Administrativo → Credenciales Admin → Dashboard
```

**Credenciales Admin:**
```
Usuario: admin
Contraseña: admin123
```

**Secciones Admin:**
- **Dashboard:** Métricas, gráficos, actividad reciente
- **Usuarios:** Tabla filtrable, crear/editar/eliminar
- **Grupos:** Gestión de grupos activos
- **Mensajes:** Auditoría (contenido cifrado, solo metadatos)
- **Configuración:** SMTP, SMS, API, parámetros
- **Seguridad:** Políticas, bitácora de eventos

## Funcionalidades Principales

### Chat
- Escribir mensajes con Enter
- Emojis y archivos (placeholders)
- Estados: Enviando → Enviado → Recibido → Visto
- Banner de cifrado E2E
- Mensajes con timestamp

### Seguridad
- Código de seguridad único
- Renovación automática de claves
- Detección de cambio de dispositivo
- Verificación de identidad

### Administración
- Búsqueda y filtros
- Gestión de usuarios/grupos
- Logs de seguridad
- Configuración del sistema

## Navegación

**Todos los enlaces y botones son funcionales:**
- Click en chat → abre conversación
- Click en grupo → muestra detalles
- Click en contacto → inicia chat
- Menú de opciones (⋮) → acciones contextuales

## Estados Visuales

- **Toast notifications:** Éxito, error, info (esquina inferior derecha)
- **Estados vacíos:** Cuando no hay datos
- **Cargando:** Spinners simulados
- **Hover/Active:** Estados visuales de botones e items

## Datos Mock

El sistema incluye:
- 5 chats con historial
- 2 grupos con miembros
- 5 contactos
- 2 estados públicos
- 5 usuarios (admin)
- 4 grupos (admin)
- Actividad simulada

## Responsive

- **Desktop:** Interfaz completa
- **Tablet:** Interfaz adaptativa
- **Mobile (Cliente):** Sidebar colapsable, interfaz optimizada

## Detalles Técnicos

- **Framework:** Next.js 16
- **Estilos:** Tailwind CSS + Diseño institucional
- **Estado:** Context API
- **Componentes:** Shadcn/ui + custom

## Rutas Disponibles

```
/ → Landing (Pública)
? → Login (Autenticación)
? → Verify SMS
? → Profile Setup
? → Chat Interface (Cliente)
? → Admin Login
? → Admin Dashboard
```

*(Todas las rutas se controlan mediante state global, sin URLs específicas)*

## Tips de Navegación

1. Usa el botón "Volver" para regresar a landing
2. Busca en los campos de búsqueda para filtrar
3. Click derecho en items para contexto (⋮)
4. El sidebar se puede cerrar en mobile
5. Prueba los filtros en Chats y admin

## Lo Que NO Funciona (Por Ser Mockup)

- No hay persistencia de datos
- No hay backend real
- No se envían mensajes reales
- No se sincronizan contactos reales
- No se envía SMS
- Las imágenes son placeholders
- No hay llamadas de video/audio

## Lo QUE SÍ Funciona

- Navegación completa entre pantallas
- Estados visuales realistas
- Filtros y búsquedas
- Validaciones de formularios
- Toast notifications
- Responsive design
- Interactividad en UI

## Soporte

Para reportes o sugerencias sobre el mockup, consulta la documentación completa en `CUCHATHNET_GUIDE.md`

---

**Versión:** 1.0.0  
**Última actualización:** 2026-02-11  
**Institución:** CUC - Universidad Central
