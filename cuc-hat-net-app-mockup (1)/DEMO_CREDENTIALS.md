# CUChatNet - Credenciales Demo y Navegación

## Credenciales de Prueba

### Usuario Cliente (REQ-1)

```
Teléfono: [Cualquier número válido]
Código SMS: 123456
Nombre: [Cualquier nombre]
Descripción: [Opcional]
```

**Ejemplo:**
```
País: Costa Rica (+506)
Teléfono: 87654321
Código: 123456
Nombre: Juan Pérez
Descripción: Estudiante de Ingeniería
```

### Usuario Administrador

```
Usuario: admin
Contraseña: admin123
```

## Rutas de Navegación

### Flujo Cliente/Usuario

```
1. Landing (Pública)
   ↓
2. Ingresar como Usuario
   ↓
3. Login Screen
   - Selecciona país (Costa Rica por defecto)
   - Ingresa número de teléfono
   - Click "Enviar Código"
   ↓
4. Verify SMS Screen
   - Ingresa código: 123456
   - Click "Verificar"
   ↓
5. Profile Setup
   - Nombre (obligatorio)
   - Descripción (opcional)
   - Click "Completar Perfil"
   ↓
6. Chat Interface (Vista Principal)
   ├─ Tab "Chats"
   │  ├─ Búsqueda y filtros
   │  ├─ Lista de conversaciones
   │  └─ Menú contextual (⋮)
   │
   ├─ Tab "Grupos"
   │  ├─ Búsqueda
   │  └─ Lista de grupos activos
   │
   ├─ Tab "Contactos"
   │  ├─ Búsqueda A-Z
   │  └─ Iniciar chat desde contacto
   │
   ├─ Tab "Estados"
   │  ├─ Crear nuevo estado
   │  └─ Ver estados de otros (24h)
   │
   └─ Tab "Ajustes"
      ├─ Seguridad (Claves, códigos)
      ├─ Privacidad (Quién me ve)
      ├─ Notificaciones
      └─ Acerca de
```

### Flujo Administrador

```
1. Landing (Pública)
   ↓
2. Acceso Administrativo
   ↓
3. Admin Login
   - Usuario: admin
   - Contraseña: admin123
   - Click "Iniciar Sesión"
   ↓
4. Admin Dashboard (Panel Principal)
   ├─ Dashboard
   │  ├─ 4 tarjetas de métricas
   │  ├─ 2 gráficos simulados
   │  └─ Historial de actividad reciente
   │
   ├─ Usuarios
   │  ├─ Tabla de usuarios
   │  ├─ Búsqueda y filtros
   │  └─ Acciones: Ver, Editar, Eliminar
   │
   ├─ Grupos
   │  ├─ Tabla de grupos
   │  ├─ Información de miembros
   │  └─ Acciones por grupo
   │
   ├─ Mensajes
   │  ├─ Auditoría (solo metadatos, contenido cifrado)
   │  ├─ Tabla de eventos
   │  └─ Búsqueda y filtros
   │
   ├─ Configuración
   │  ├─ Parámetros generales
   │  ├─ SMTP (Email)
   │  ├─ SMS (Twilio, etc)
   │  └─ API Transaccional
   │
   └─ Seguridad
      ├─ Políticas de seguridad
      └─ Bitácora de eventos
```

## Acciones en Cada Pantalla

### Login
- **Selector de País:** Cambia extensión telefónica
- **Input Teléfono:** Solo acepta números
- **Botón "Enviar Código":** Navega a SMS Verify

### Verify SMS
- **Input Código:** Solo 6 dígitos (demo: 123456)
- **Botón "Verificar":** Navega a Profile Setup si es correcto
- **"Reenviar Código":** Simulado

### Profile Setup
- **Input Nombre:** Obligatorio
- **Textarea Descripción:** Opcional, 100 caracteres
- **Botón "Completar Perfil":** Navega a Chat

### Chat Interface
#### Sidebar
- **Tabs de navegación:** Cambia entre vistas
- **Botón usuario:** Muestra info de perfil
- **"Ajustes":** Navega a Settings
- **"Cerrar sesión":** Regresa a Landing

#### Chats Tab
- **Búsqueda:** Filtra por nombre
- **Botones de filtro:** Todos / No leídos / Fijados
- **Click en chat:** Abre conversación
- **Menú (⋮):** Fijar, Archivar, Eliminar

#### Chat Window
- **Input de mensaje:** Escribir y Enter para enviar
- **Botón emoji:** (placeholder)
- **Botón archivo:** (placeholder)
- **Botón enviar:** Envía mensaje

#### Groups Tab
- **Búsqueda:** Filtra por nombre grupo
- **Click en grupo:** Abre detalles

#### Contacts Tab
- **Búsqueda:** Filtra A-Z
- **Icono chat:** Inicia conversación

#### States Tab
- **Botón "Crear estado":** Modal para crear
- **Estados propios:** Mostrados al top
- **Estados otros:** Click para ver detalles

#### Settings
- **Tabs:** Seguridad / Privacidad / Notificaciones / Acerca de
- **Toggles:** Cambiar configuraciones
- **Selects:** Opciones de privacidad

### Admin Dashboard

#### Dashboard Tab
- **Tarjetas:** Muestran métricas
- **Gráficos:** Placeholders
- **Actividad:** Historial simulado

#### Users Tab
- **Búsqueda:** Por nombre o email
- **Filtros:** Todos / Activos / Inactivos
- **Tabla:** Scroll horizontal en mobile
- **Acciones:** Botones en última columna
- **Botón "+ Nuevo Usuario":** (placeholder)

#### Groups Tab
- **Búsqueda:** Por nombre de grupo
- **Tabla:** Información de grupos
- **Acciones:** Editar/Eliminar

#### Messages Tab
- **Nota de privacidad:** Banner azul explicando E2E
- **Búsqueda:** Por usuario
- **Tabla:** Metadatos de mensajes
- **Estado:** Color según entrega

#### Config Tab
- **Inputs:** Cambiar parámetros
- **Selects:** Elegir opciones
- **Botones "Probar":** (simulados)
- **Botón "Guardar Cambios":** Toast de confirmación

#### Security Tab
- **Sub-tab "Políticas":**
  - Toggles para activar/desactivar
  - Inputs para parámetros
  
- **Sub-tab "Logs":**
  - Tabla de eventos
  - Filtro por nivel (Crítico/Advertencia/Info)
  - Botones descargar/actualizar

## Toast Notifications

Aparecen en esquina inferior derecha:

```
Éxito (Verde):
✓ Mensaje enviado
✓ Conversación archivada
✓ Configuración guardada

Error (Rojo):
✗ Por favor completa todos los campos
✗ Código incorrecto
✗ Credenciales inválidas

Info (Azul):
ⓘ Sesión cerrada
ⓘ Iniciando chat...
```

## Búsquedas y Filtros

### Chats
- **Búsqueda:** Filtra por nombre del participante
- **Filtro Todos:** Muestra todos los chats
- **Filtro No leídos:** Solo chats con mensajes sin leer
- **Filtro Fijados:** Solo chats fijados

### Grupos
- **Búsqueda:** Filtra por nombre de grupo

### Contactos
- **Búsqueda:** Filtra por nombre de contacto

### Admin - Usuarios
- **Búsqueda:** Filtra por nombre o email
- **Filtro Todos:** Todos los usuarios
- **Filtro Activos:** Usuarios con sesión reciente
- **Filtro Inactivos:** Usuarios sin actividad

### Admin - Grupos
- **Búsqueda:** Filtra por nombre de grupo

### Admin - Mensajes
- **Búsqueda:** Filtra por usuario (remitente)

## Estados Visuales

### Chat List
- **No leído:** Nombre en bold, numero rojo
- **Seleccionado:** Fondo azul claro
- **Hover:** Fondo gris claro

### Messages
- **De usuario:** Burbuja azul, derecha
- **De otro:** Burbuja gris, izquierda
- **Estados:**
  - ⏱ Enviando (animado)
  - ✓ Enviado
  - ✓✓ Recibido
  - ✓✓ Visto (color azul)

### Admin Tables
- **Row hover:** Fondo gris claro
- **Active filter:** Botón azul, texto blanco
- **Status badge:** Color según estado
  - Verde: Activo
  - Gris: Inactivo
  - Rojo: Crítico

## Validaciones

### Teléfono
- Solo números permitidos
- Máximo 8 dígitos
- Obligatorio

### Código SMS
- Solo números permitidos
- Exactamente 6 dígitos
- Obligatorio

### Nombre Perfil
- Obligatorio
- Máximo 50 caracteres
- No puede estar vacío

### Descripción
- Opcional
- Máximo 100 caracteres
- Contador mostrado

### Formularios Admin
- Campos obligatorios indicados con *
- Validación cliente
- Tooltip en hover

## Datos Precargados

El mockup incluye datos simulados que se cargan automáticamente:

```
Chats (5):
- Ana García: 2 no leídos
- Carlos López: Fijado
- María Rodríguez
- Juan Martínez
- Sofia Pérez

Grupos (2):
- Equipo Proyecto: 3 miembros
- Curso Ingeniería: 2 miembros

Contactos (5):
- Todos con información completa
- Algunos con descripción

Estados (2):
- Ana García: Visto por 1
- Carlos López: No visto

Usuarios Admin (5):
- Mezcla de activos e inactivos
- Diferentes fechas de unión

Grupos Admin (4):
- Diferentes creadores
- Diferentes cantidades de miembros

Eventos Seguridad (5):
- Mezcla de niveles
- Timestamps variados
```

## Troubleshooting

### Código SMS no funciona
- Asegúrate de ingresar exactamente `123456`
- Sin espacios ni caracteres especiales

### Admin no carga
- Usuario: `admin` (minúsculas)
- Contraseña: `admin123` (minúsculas)
- Exactamente como está escrito

### Toast no aparece
- Suele estar en esquina inferior derecha
- Se cierra automáticamente en 3 segundos
- Busca el botón X si persiste

### Sidebar se ve colapsado
- En mobile, haz click en el ícono menu (≡)
- Se expandirá la navegación

### Búsqueda no filtra
- Revisa que escribiste correctamente
- Busca nombres completos (no parciales)
- Sensible a minúsculas/mayúsculas en algunos casos

---

**Última Actualización:** 2026-02-11  
**Versión:** 1.0.0  
**Estado:** Funcional
