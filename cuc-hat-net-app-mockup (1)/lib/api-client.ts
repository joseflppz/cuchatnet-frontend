const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "https://localhost:7086"

/**
 * Función auxiliar para normalizar URLs y evitar el error 404 por rutas duplicadas (ej: /api/api/)
 * Mantiene la compatibilidad con el código del equipo sin alterar la funcionalidad.
 */
const getUrl = (path: string) => {
  // 1. Limpiamos la base de barras al final
  let base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  
  // 2. Nos aseguramos de que el path empiece con una sola barra
  let cleanPath = path.startsWith('/') ? path : `/${path}`;

  // 3. Lógica de seguridad mejorada:
  // Si la base ya termina en /api y el path trae /api, evitamos la duplicación.
  if (base.endsWith('/api') && cleanPath.startsWith('/api/')) {
    cleanPath = cleanPath.replace('/api/', '/');
  }

  // 4. Si la base NO tiene /api y el path tampoco, lo agregamos (opcional, por seguridad)
  if (!base.endsWith('/api') && !cleanPath.startsWith('/api/')) {
    base = `${base}/api`;
  }

  return `${base}${cleanPath}`;
};

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(getUrl(path), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await safeJson(response)
    throw new Error(error?.error || `HTTP ${response.status}`)
  }

  return response.json()
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(getUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await safeJson(response)
    throw new Error(error?.error || `HTTP ${response.status}`)
  }

  return response.json()
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(getUrl(path), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await safeJson(response)
    throw new Error(error?.error || `HTTP ${response.status}`)
  }

  return response.json()
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(getUrl(path), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await safeJson(response)
    throw new Error(error?.error || `HTTP ${response.status}`)
  }

  return response.json()
}

export async function apiDelete<T>(path: string): Promise<T> {
  const response = await fetch(getUrl(path), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await safeJson(response)
    throw new Error(error?.error || `HTTP ${response.status}`)
  }

  return response.json()
}

async function safeJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}