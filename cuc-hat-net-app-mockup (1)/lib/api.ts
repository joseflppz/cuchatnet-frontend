// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7086/api';

/**
 * Función base para todas las peticiones
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  try {
    // Eliminamos cualquier slash inicial del endpoint para evitar dobles slashes //
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    const response = await fetch(`${API_URL}/${cleanEndpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Esto nos ayudará a ver en consola si el error es un 400, 404 o 500
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.error("❌ Error en apiFetch:", error);
    throw error;
  }
}
// En lib/api.ts modifica solo esta función:

export async function uploadFile(chatId: string | number, file: File) {
  const id = getCleanId(chatId);
  const formData = new FormData();
  formData.append('file', file);

  // Cambiamos la ruta para que coincida con el MediaController de C#
  // Usamos fetch directo para evitar que apiFetch le meta headers de JSON
  const response = await fetch(`${API_URL}/media/upload/${id}`, {
    method: 'POST',
    body: formData,
    // NO añadir headers aquí
  });

  if (!response.ok) {
    const errorMsg = await response.text();
    throw new Error(`Error en subida: ${errorMsg}`);
  }

  return await response.json(); // Esto devuelve { url: "..." }
}
/**
 * Utilidad para limpiar IDs (por si vienen como "chat-1")
 */
const getCleanId = (id: string | number): string => {
  const match = String(id).match(/\d+/);
  return match ? match[0] : String(id);
};

// ==========================================
// SECCIÓN: CHATS Y MENSAJES
// ==========================================

// lib/api.ts

// 1. Obtener mensajes (Ruta correcta: api/chats/{id}/messages)
export async function getMessages(chatId: string | number) {
  const id = getCleanId(chatId);
  return apiFetch(`chats/${id}/messages`);
}

// 2. Enviar mensaje (Ruta correcta: api/chats/{id}/messages)
export async function sendMessage(chatId: string | number, payload: any) {
  const id = getCleanId(chatId);
  
  // El payload debe ir directo, no envuelto en otro objeto 'request' 
  // a menos que tu DTO en C# lo pida así.
  return apiFetch(`chats/${id}/messages`, {
    method: "POST",
    body: JSON.stringify(payload) 
  });
}

// 3. Subidaa de archivos (Para que funcionen imágenes/videos/audios)



// ==========================================
// SECCIÓN: ESTADOS (CORREGIDO EL 404)
// ==========================================

// ✅ Obtener el feed de estados
export const getStatesFeed = async (userId: string | number) => {
  const id = getCleanId(userId);
  // Eliminamos el "/api" extra porque ya está en API_URL
  return apiFetch(`users/${id}/states-feed`);
};

// ✅ Crear un estado
export const createState = async (userId: string | number, data: any) => {
  const id = getCleanId(userId);
  if (!id || id === 'undefined') throw new Error("ID de usuario no válido");

  return apiFetch(`users/${id}/states`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// ✅ Marcar estado como visto
export const viewState = async (stateId: string | number, userId: string | number) => {
  const sId = getCleanId(stateId);
  return apiFetch(`states/${sId}/view`, {
    method: 'POST',
    body: JSON.stringify({ userId: Number(userId) }), 
  });
};

// ✅ Eliminar estado
export const deleteState = async (stateId: string | number) => {
  const sId = getCleanId(stateId);
  return apiFetch(`states/${sId}`, {
    method: 'DELETE',
  });
};

// Agrega esto al final de tu archivo api.ts
export async function addContact(userId: number, contactUserId: number) {
  return apiFetch(`contactos`, {
    method: 'POST',
    body: JSON.stringify({
      userId: userId,
      contactUserId: contactUserId
    })
  });
}

// En lib/api.ts

// Para crear el grupo (POST)
export async function createGroupApi(groupData: { 
  userId: number, 
  participantesIds: number[], 
  esGrupo: boolean, 
  nombreGrupo: string 
}) {
  return apiFetch(`chats`, {
    method: 'POST',
    body: JSON.stringify(groupData)
  });
}

// Para obtener los grupos (GET)
// En lib/api.ts
export async function getMyGroups(userId: number) {
  // Este endpoint debe devolver los chats donde 'esGrupo' es true para este usuario
  return apiFetch(`chats/${userId}`); 
}