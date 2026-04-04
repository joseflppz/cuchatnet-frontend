const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://localhost:7086'

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
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
  const response = await fetch(`${API_BASE}${path}`, {
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
  const response = await fetch(`${API_BASE}${path}`, {
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
  const response = await fetch(`${API_BASE}${path}`, {
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

async function safeJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}
