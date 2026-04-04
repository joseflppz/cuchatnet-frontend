# CUChatNet - Sistema de Mensajería Seguro

## Descripción General

CUChatNet es un mockup (prototipo no funcional) completo de una aplicación web de mensajería similar a WhatsApp, diseñada para estudiantes y administrativos universitarios. El sistema incluye dos vistas principales: **Vista Cliente/Usuario** y **Vista Administrativa**, con navegación completamente funcional entre pantallas.

## Identidad Visual

- **Colores Institucionales:**
  - Azul Principal: #0A2E6D
  - Rojo Secundario: #E21B23
  - Blanco: #FFFFFF
  - Grises y Neutros complementarios

- **Estilo:** Moderno, limpio, universitario/tech con tipografía sans-serif (Inter/Roboto)
- **Componentes:** Bordes suaves, sombras ligeras, estados visuales claros (hover/active/focus)

## Cómo Usar

### Acceso Inicial

La aplicación comienza en la **Página de Aterrizaje** que contiene:
- Explicación del sistema
- Descripción de requerimientos y seguridad
- Dos botones principales:
  - **"Ingresar como Usuario"** → Flujo de Login
  - **"Acceso Administrativo"** → Panel Admin

## Vista Cliente/Usuario

### 1. Registro y Verificación (REQ-1)

**Flujo de Autenticación:**
1. **Pantalla de Login:**
   - Selector de país/extensión (+506 Costa Rica por defecto)
   - Campo de número de teléfono
   - Validaciones de formato

2. **Verificación SMS:**
   - Pantalla "Enviando SMS..." (simulada)
   - Campo para ingresar código de 6 dígitos
   - Opción de reenvío
   - **Código demo: `123456`**

3. **Configuración de Perfil:**
   - Nombre completo
   - Descripción (opcional)
   - Estado de disponibilidad (Disponible/Ocupado/Ausente)

### 2. Interfaz Principal (REQ-2 a REQ-8)

La interfaz cliente se divide en dos áreas:

#### **Barra Lateral (Sidebar):**
- Logo y nombre del usuario
- **Navegación por Tabs:**
  - **Chats:** Lista de conversaciones individuales
  - **Grupos:** Grupos de chat activos
  - **Contactos:** Lista de contactos con opción de iniciar chat
  - **Estados:** Crear y ver estados de 24 horas
  - **Ajustes:** Configuración y seguridad

#### **Área Principal:**
- Ventana de chat con historial de mensajes
- Barra de escritura con opciones de emoji y archivos
- Estados visuales de mensajes: enviado (✓), recibido (✓✓), visto (✓✓)
- Banner indicando "Cifrado de extremo a extremo"

### 3. Gestión de Chats (REQ-3)

**Funcionalidades:**
- Búsqueda global de chats
- Filtros: Todos / No leídos / Fijados
- Acciones por chat:
  - Fijar/Desfijar
  - Archivar
  - Eliminar
  - Borrar historial
- Contador de mensajes no leídos
- Hora del último mensaje

### 4. Gestión de Grupos (REQ-2)

**Funcionalidades:**
- Ver lista de grupos
- Información del grupo: nombre, miembros, descripción
- Rol del usuario: Admin/Miembro
- Agregar/quitar miembros
- Permisos de grupo simulados

### 5. Gestión de Contactos (REQ-4)

**Funcionalidades:**
- Sincronización de contactos (simulada)
- Búsqueda A-Z
- Crear chat individual desde contacto
- Crear grupo desde selección múltiple
- Ver descripción y estado del contacto

### 6. Seguridad - Cifrado E2E (REQ-5)

**Pantalla de Seguridad:**
- Banner de "Cifrado de extremo a extremo activado" con icono candado
- Código de seguridad único para verificar identidad
- Claves por dispositivo (simuladas)
- Renovación automática de claves cada 30 días
- Protección contra cambio de dispositivo detectado
- Verificación de identidad con QR/código

### 7. Estados/Stories (REQ-8)

**Funcionalidades:**
- Crear estado: texto o imagen
- Editor simple con vista previa
- Duración: 24 horas con contador
- Visualización de "visto por"
- Silenciar estados de contactos específicos
- Eliminar estados manualmente

### 8. Configuración del Usuario

**Tabs disponibles:**
- **Seguridad:** Claves, verificación de identidad, cambios de dispositivo
- **Privacidad:** Quién me ve en línea, ve foto, ve estados, confirmación de lectura
- **Notificaciones:** Alertas, sonido, vibración
- **Acerca de:** Versión, institución, términos y privacidad

## Vista Administrativa

### Acceso Admin

- Usuario: `admin`
- Contraseña: `admin123`

### Panel de Control

#### **1. Dashboard**
Métricas principales:
- Usuarios registrados: 1,247
- Usuarios activos hoy: 487
- Mensajes por día (promedio): 12,543
- Grupos activos: 324
- Gráficos de actividad (placeholders)
- Historial de actividad reciente

#### **2. Gestión de Usuarios**
**Tabla con:**
- Nombre, Email, Teléfono
- Fecha de unión, Último acceso
- Estado (Activo/Inactivo)
- Acciones: Ver, Editar, Eliminar
- Búsqueda y filtros por estado

#### **3. Gestión de Grupos**
**Tabla con:**
- Nombre del grupo
- Creador
- Número de miembros
- Cantidad de mensajes
- Fecha de creación
- Acciones: Editar, Eliminar

#### **4. Auditoría de Mensajes**
**Información:**
- ID del mensaje
- Remitente
- Tipo (Chat/Grupo)
- Timestamp
- Estado de entrega
- Cifrado E2E (indicado con 🔒)
- Nota: El contenido está cifrado y no es visible

#### **5. Configuración del Sistema**
**Parámetros:**
- Nombre de aplicación
- Tamaño máximo de grupo
- Timeout de mensajes
- Tamaño máximo de archivo
- **Configuración SMTP:** Servidor, puerto, pruebas
- **Proveedor SMS:** Twilio/AWS SNS/Nexmo, API key
- **API Transaccional:** Endpoint, token, pruebas

#### **6. Seguridad y Bitácora**
**Políticas:**
- Bloqueo por intentos fallidos (5 intentos)
- Renovación automática de claves (cada 30 días)
- Detección de cambio de dispositivo
- Verificación de identidad requerida
- Cifrado E2E obligatorio
- Configuración de parámetros de seguridad

**Bitácora de Eventos:**
- Tabla con eventos de seguridad
- Filtro por nivel: Crítico, Advertencia, Información
- Timestamps y usuarios involucrados
- Opción de descargar logs en CSV

## Navegación y Características

### Navegación Interna
- Todos los botones y enlaces navegan entre pantallas
- No depende del botón atrás/adelante del navegador
- Migas de pan (breadcrumbs) en admin
- Menú lateral persistente en vistas principales

### Respuesta
- **Vista Cliente:** Responsive móvil (mobile-first) y desktop
- **Vista Admin:** Adaptativa para desktop/tablet

### Estados Visuales
- Estados vacíos cuando no hay datos
- Estados de carga simulados (spinners)
- Mensajes de error y confirmación
- Toast notifications para acciones

### Validaciones
- Campos obligatorios indicados
- Formatos validados (teléfono, email)
- Límites de caracteres mostrados
- Confirmaciones para acciones destructivas

## Características de Seguridad (Simuladas)

- **Cifrado E2E:** Indicado en todas las conversaciones
- **Hash de Contraseñas:** Mención de bcrypt en landing
- **Sesiones Seguras:** Cookies HTTP-only
- **Protección SQL:** Consultas parametrizadas
- **Validación de Entrada:** Sanitización simulada
- **Renovación de Claves:** Periódica (30 días)

## Datos Mock Incluidos

El sistema viene precargado con datos simulados:
- **5 chats** con mensajes históricos
- **2 grupos** con miembros y roles
- **5 contactos** con detalles
- **2 estados** de otros usuarios
- **5 usuarios administrados** en lista
- **4 grupos** en administración
- Actividad simulada (logs, eventos)

## Demostración

1. **Abre la aplicación** → Landing page
2. **Click en "Ingresar como Usuario"**
3. **Ingresa cualquier número** (validará formato)
4. **Code SMS:** `123456`
5. **Completa tu perfil**
6. **Explora:** Chats, Grupos, Contactos, Estados, Ajustes
7. **Para Admin:** Vuelve a landing → "Acceso Administrativo" → admin/admin123

## Estructura del Código

```
/app
  - page.tsx (Punto de entrada con AppProvider)
  - globals.css (Tema institucional)
  - layout.tsx (Metadata)

/contexts
  - AppContext.tsx (Estado global de la aplicación)

/components
  - Landing.tsx (Página pública)
  - AuthScreens.tsx (Login, SMS, Perfil, Admin Login)
  - ChatInterface.tsx (Cliente principal)
  - ChatList.tsx, GroupsList.tsx, ContactsList.tsx, StatesList.tsx (Listas)
  - ChatWindow.tsx (Ventana de chat)
  - SettingsScreen.tsx (Configuración usuario)
  - Toast.tsx (Notificaciones)
  - AdminDashboard.tsx (Panel admin principal)
  - /admin/ (Vistas administrativas específicas)
```

## Notas Importantes

- **Este es un MOCKUP:** No hay backend real, todas las operaciones son simuladas
- **Datos en Memoria:** Los datos persisten solo durante la sesión del usuario
- **Navegación Funcional:** Todos los clics navegan correctamente entre pantallas
- **Estilos Responsive:** Se adapta a diferentes tamaños de pantalla
- **Accesibilidad:** Incluye contraste adecuado, ARIA roles, y navegación por teclado

## Requerimientos Implementados

✓ REQ-1: Registro y verificación SMS  
✓ REQ-2: Gestión de grupos (crear, editar, permisos)  
✓ REQ-3: Envío y recepción de mensajes con estados  
✓ REQ-4: Gestión de contactos y sincronización  
✓ REQ-5: Cifrado de extremo a extremo (visual)  
✓ REQ-6: Multimedia (botones, placeholders)  
✓ REQ-7: Descripción de usuario  
✓ REQ-8: Estados/Stories de 24 horas

## Panel Administrativo Completo

✓ Dashboard con métricas  
✓ CRUD de usuarios  
✓ Gestión de grupos  
✓ Auditoría de mensajes  
✓ Configuración del sistema (SMTP, SMS, API)  
✓ Seguridad y políticas  
✓ Bitácora de eventos

---

**Versión:** 1.0.0 (Mockup)  
**Institución:** CUC - Universidad Central  
**Cuatrimestre:** 1, 2026
