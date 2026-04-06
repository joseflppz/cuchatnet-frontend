'use client'

import { useEffect, useState } from 'react'
import { Search, Trash2, Eye, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7086"

function getToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("admin_token")
}

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

interface Message {
  id: number
  sender: string
  type: string
  destination: string
  conversationId: string
  timestamp: string
  status: string
  encrypted: boolean
  device: string | null
  ip: string | null
  deliveredAt: string | null
  seenAt: string | null
}

export default function AdminMessagesView() {
  const [messages, setMessages] = useState<Message[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Message | null>(null)
  const [search, setSearch] = useState('')

  const fetchMessages = (p = 1) => {
    setLoading(true)
    apiFetch<any>(`/api/admin/messages?page=${p}&pageSize=50`)
      .then(res => {
        if (Array.isArray(res)) {
          setMessages(res)
          setTotal(res.length)
          setTotalPages(1)
          setPage(1)
        } else {
          setMessages(res.data ?? [])
          setTotal(res.total ?? 0)
          setTotalPages(res.totalPages ?? 1)
          setPage(res.page ?? 1)
        }
      })
      .catch(() => setError('Error al cargar mensajes'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchMessages() }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null)
    }
    if (selected) window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selected])

  const handleDelete = async (msgId: number) => {
    if (!window.confirm('¿Eliminar este mensaje?')) return
    try {
      await apiFetch(`/api/admin/messages/${msgId}`, {
        method: 'DELETE',
        body: JSON.stringify({ motivo: 'Eliminado desde panel admin' }),
      })
      fetchMessages(page)
      if (selected?.id === msgId) setSelected(null)
    } catch {
      alert('Error al eliminar mensaje')
    }
  }

  const filtered = messages.filter(m =>
    m.sender.toLowerCase().includes(search.toLowerCase()) ||
    m.destination.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>Nota de Privacidad:</strong> El contenido de los mensajes está cifrado de extremo a
          extremo y no es visible en auditoría. Se muestran solo metadatos de entrega y estado.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por remitente o destino..."
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{total} mensajes en total</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">Cargando mensajes...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <Card className="border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3 text-left font-semibold text-foreground">ID</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Remitente</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Tipo</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Destino</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Timestamp</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Estado</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Cifrado</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((msg) => (
                  <tr key={msg.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-muted-foreground">msg-{msg.id}</td>
                    <td className="px-6 py-3 font-medium text-foreground">{msg.sender}</td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                        {msg.type === 'group' ? 'Grupo' : 'Chat'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{msg.destination}</td>
                    <td className="px-6 py-3 text-muted-foreground text-xs">
                      {new Date(msg.timestamp).toLocaleString('es-CR')}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        msg.status === 'Visto' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {msg.status}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {msg.encrypted
                        ? <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 font-medium">🔒 E2E</span>
                        : <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">Sin cifrar</span>
                      }
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelected(msg)}
                          className="p-1 hover:bg-muted rounded"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="p-1 hover:bg-red-100 rounded"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td className="px-6 py-6 text-sm text-muted-foreground" colSpan={8}>
                      No hay mensajes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Página {page} de {totalPages}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => fetchMessages(page - 1)}>
            Anterior
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => fetchMessages(page + 1)}>
            Siguiente
          </Button>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground">Detalle de auditoría</p>
                <p className="text-xs text-muted-foreground">
                  msg-{selected.id} • {selected.type === 'group' ? 'Grupo' : 'Chat'} •{' '}
                  {selected.encrypted ? 'E2E' : 'No cifrado'}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="text-foreground/60 hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Remitente</p>
                  <p className="font-medium text-foreground">{selected.sender}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">{selected.type === 'group' ? 'Grupo' : 'Destinatario'}</p>
                  <p className="font-medium text-foreground">{selected.destination}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Conversation ID</p>
                  <p className="font-mono text-xs text-foreground">{selected.conversationId}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">IP origen</p>
                  <p className="font-medium text-foreground">{selected.ip ?? '—'}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border p-3">
                <p className="text-sm font-semibold text-foreground mb-2">Eventos</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                    <span className="text-foreground">Enviado</span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(selected.timestamp).toLocaleString('es-CR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                    <span className="text-foreground">Entregado</span>
                    <span className="text-muted-foreground text-xs">
                      {selected.deliveredAt ? new Date(selected.deliveredAt).toLocaleString('es-CR') : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                    <span className="text-foreground">Visto</span>
                    <span className="text-muted-foreground text-xs">
                      {selected.seenAt ? new Date(selected.seenAt).toLocaleString('es-CR') : '—'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  * El contenido del mensaje no se muestra por cifrado E2E.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelected(null)}>Cerrar</Button>
                <Button
                  className="bg-red-500 hover:bg-red-600 text-white"
                  onClick={() => handleDelete(selected.id)}
                >
                  Eliminar mensaje
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}