# CUChatNET

CUChatNET es un sistema de mensajería tipo WhatsApp dividido en dos partes:

- **Frontend**: aplicación web en **Next.js**
- **Backend**: API REST en **ASP.NET Core Web API (C#)**
- **Base de datos**: **SQL Server**

---

## Estructura del proyecto

```bash
Frontend_backend_CuChatNet/
│
├── cuc-hat-net-app-mockup (1)/   # Frontend en Next.js
├── CUChatNet_Backend/            # Backend en C# ASP.NET Core
├── ccnet.sql                     # Script de base de datos
└── README.md
Qué hace cada parte
Frontend

El frontend es la interfaz visual del sistema.
Aquí se muestran:

login
chats
contactos
grupos
estados
panel administrativo

Actualmente parte de la lógica todavía está en transición desde mock/localStorage hacia conexión real con el backend.

Backend

El backend es la API que maneja la lógica del sistema y la conexión con SQL Server.

Incluye endpoints para:

autenticación
chats
mensajes
contactos
estados
administración
health check

El backend responde al frontend por medio de HTTP/JSON.

Cómo funciona el proyecto

El flujo general es este:

Frontend (Next.js)
↓
Peticiones HTTP / fetch
↓
Backend (ASP.NET Core Web API)
↓
SQL Server
Estado actual del proyecto

Actualmente:

ya existe una base de datos real en SQL Server
ya existe un backend real en C#
el frontend ya empezó a conectarse por partes al backend
la parte de mensajes ya fue iniciada
el login real todavía está en desarrollo
Importante

Por ahora el login aún debe simularse/mockearse en algunas partes, ya que el flujo completo de autenticación y registro real todavía se está terminando.

Cómo ejecutar el frontend

Entrar a la carpeta del frontend:

cd "cuc-hat-net-app-mockup (1)"

Instalar dependencias:

npm install

Ejecutar el proyecto:

npm run dev

Luego abrir en el navegador:

http://localhost:3000
Cómo ejecutar el backend

Entrar al proyecto del backend y abrir la solución en Visual Studio:

CUChatNet_Backend/solution/CUChatNet.sln

Ejecutar desde:

Visual Studio
IIS Express o Kestrel

Cuando levante correctamente, se puede probar en Swagger.

Base de datos

La base de datos se crea en SQL Server usando el script:

ccnet.sql

Ese script debe ejecutarse primero en SQL Server Management Studio para crear la estructura inicial.
