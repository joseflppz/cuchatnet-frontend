// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "https://localhost:7086/api";

/**
 * Normaliza URLs para evitar errores de rutas duplicadas o slashes mal puestos.
 */
const getUrl = (path: string) => {
  let base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  let cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Evita duplicar /api si la base ya lo trae
  if (base.endsWith('/api') && cleanPath.startsWith('/api/')) {
    cleanPath = cleanPath.replace('/api/', '/');
  }
  return `${base}${cleanPath}`;
};

/**
 * Función base para peticiones (apiFetch) con soporte para Query Params
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}, params?: Record<string, any>) {
  try {
    let url = getUrl(endpoint);

    if (params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) query.append(key, String(val));
      });
      const queryString = query.toString();
      if (queryString) url += `?${queryString}`;
    }
    
    const isFormData = options.body instanceof FormData;

    const response = await fetch(url, {
      cache: 'no-store', 
      ...options,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.error("❌ Error en apiFetch:", error);
    throw error;
  }
}

/**
 * Utilidad para limpiar IDs. 
 * CORRECCIÓN PARA LOGIN: Si el ID no es puramente numérico (como un email o string), 
 * lo devuelve tal cual para no romper la autenticación.
 */
const getCleanId = (id: string | number): string => {
  if (!id) return "0";
  const strId = String(id);
  // Si contiene letras o caracteres especiales (como en el login), no lo limpies
  if (/[a-zA-Z]/.test(strId)) return strId;
  
  const match = strId.match(/\d+/);
  return match ? match[0] : strId;
};

// ==========================================
// SECCIÓN: CHATS Y MENSAJES
// ==========================================

export async function getMyGroups(userId: number | string) {
  const id = getCleanId(userId);
  return apiFetch(`users/${id}/chats`); 
}

export async function getMessages(chatId: string | number, userId?: string | number) {
  const id = getCleanId(chatId);
  return apiFetch(`chats/${id}/messages`, {}, { userId });
}

export async function sendMessage(chatId: string | number, payload: any) {
  const id = getCleanId(chatId);
  return apiFetch(`chats/${id}/messages`, {
    method: "POST",
    body: JSON.stringify(payload) 
  });
}

export async function markChatAsRead(chatId: string | number, userId: string | number) {
  const cId = getCleanId(chatId);
  return apiFetch(`chats/${cId}/read`, {
    method: "PATCH",
  }, { userId });
}

export async function uploadFile(chatId: string | number, file: File) {
  const id = getCleanId(chatId);
  const formData = new FormData();
  formData.append('file', file);

  return apiFetch(`media/upload/${id}`, {
    method: 'POST',
    body: formData,
  });
}

export const deleteMessage = async (messageId: number | string) => {
  const mId = getCleanId(messageId);
  return apiFetch(`Messages/${mId}`, {
    method: 'DELETE',
  });
};

// ==========================================
// SECCIÓN: ESTADOS (STORY FEED)
// ==========================================

export const getStatesFeed = async (userId: string | number) => {
  const id = getCleanId(userId);
  return apiFetch(`users/${id}/states-feed`);
};

export const createState = async (userId: string | number, data: any) => {
  const id = getCleanId(userId);
  return apiFetch(`users/${id}/states`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const viewState = async (stateId: string | number, userId: string | number) => {
  const sId = getCleanId(stateId);
  return apiFetch(`states/${sId}/view`, {
    method: 'POST',
    body: JSON.stringify({ userId: Number(userId) }), 
  });
};

export const deleteState = async (stateId: string | number) => {
  const sId = getCleanId(stateId);
  return apiFetch(`states/${sId}`, {
    method: 'DELETE',
  });
};

// ==========================================
// SECCIÓN: CONTACTOS Y GRUPOS
// ==========================================

export const getContacts = async () => {
  return apiFetch(`users`); 
};

export const addContact = async (userId: number, phoneNumber: string) => {
  return apiFetch(`contactos`, {
    method: 'POST',
    body: JSON.stringify({
      userId: userId,
      contactoPhone: phoneNumber 
    })
  });
};

export async function createGroupApi(groupData: { 
  CurrentUserId: number; 
  GroupName: string; 
  MemberIds: number[];
  GroupDescription?: string;
  GroupPhoto?: string;
}) {
  return apiFetch(`chats/group`, {
    method: 'POST',
    body: JSON.stringify(groupData)
  });
}