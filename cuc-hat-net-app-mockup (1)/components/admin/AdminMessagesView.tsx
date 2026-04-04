'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Eye, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type MsgType = 'chat' | 'group'
type MsgStatus = 'Entregado' | 'Visto'

type AuditMessage = {
  id: number
  sender: string
  type: MsgType
  destination: string
  conversationId: string
  timestamp: string
  status: MsgStatus
  encrypted: boolean
  device: string
  ip: string
  deliveredAt?: string
  seenAt?: string
}

export default function AdminMessagesView() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selected, setSelected] = useState<AuditMessage | null>(null)

  const messages: AuditMessage[] = useMemo(
    () => [
      {
        id: 1,
        sender: 'Juan Pérez',
        type: 'chat',
        destination: 'Ana García',
        conversationId: 'conv-CH-102',
        timestamp: '2026-02-10 14:32',
        status: 'Entregado',
        encrypted: true,
        device: 'Android • Pixel 6',
        ip: '192.168.1.25',
        deliveredAt: '2026-02-10 14:32',
      },
      {
        id: 2,
        sender: 'Ana García',
        type: 'group',
        destination: 'Curso Ingeniería',
        conversationId: 'conv-GR-220',
        timestamp: '2026-02-10 14:15',
        status: 'Visto',
        encrypted: true,
        device: 'iOS • iPhone 13',
        ip: '192.168.1.31',
        deliveredAt: '2026-02-10 14:15',
        seenAt: '2026-02-10 14:17',
      },
      {
        id: 3,
        sender: 'Carlos López',
        type: 'chat',
        destination: 'Sofía Pérez',
        conversationId: 'conv-CH-301',
        timestamp: '2026-02-10 13:45',
        status: 'Entregado',
        encrypted: true,
        device: 'Windows • Chrome',
        ip: '10.0.0.18',
        deliveredAt: '2026-02-10 13:45',
      },
      {
        id: 4,
        sender: 'María Rodríguez',
        type: 'group',
        destination: 'Área de Tecnología',
        conversationId: 'conv-GR-118',
        timestamp: '2026-02-10 13:20',
        status: 'Visto',
        encrypted: true,
        device: 'Android • Samsung',
        ip: '10.0.0.22',
        deliveredAt: '2026-02-10 13:20',
        seenAt: '2026-02-10 13:26',
      },
      {
        id: 5,
        sender: 'Sofia Pérez',
        type: 'chat',
        destination: 'Juan Pérez',
        conversationId: 'conv-CH-401',
        timestamp: '2026-02-10 12:50',
        status: 'Entregado',
        encrypted: true,
        device: 'macOS • Safari',
        ip: '10.0.0.9',
        deliveredAt: '2026-02-10 12:50',
      },
    ],
    []
  )

  const filteredMessages = messages.filter((msg) =>
    msg.sender.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Cerrar modal con ESC
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null)
    }
    if (selected) window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selected])

  return (
    <div className="p-6 space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>Nota de Privacidad:</strong> El contenido de los mensajes está cifrado de extremo a
          extremo y no es visible en auditoría. Se muestran solo metadatos de entrega y estado.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por usuario..."
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <Card className="border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-3 text-left font-semibold text-foreground">ID</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Remitente</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Tipo</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Timestamp</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Estado</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Cifrado</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.map((msg) => (
                <tr
                  key={msg.id}
                  className="border-b border-border hover:bg-muted/20 transition-colors"
                >
                  <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                    msg-{msg.id}
                  </td>
                  <td className="px-6 py-3 font-medium text-foreground">{msg.sender}</td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                      {msg.type === 'chat' ? 'Chat' : 'Grupo'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-muted-foreground text-xs">{msg.timestamp}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${msg.status === 'Visto'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                        }`}
                    >
                      {msg.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 font-medium">
                      🔒 E2E
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => setSelected(msg)}
                      className="p-1 hover:bg-muted rounded"
                      aria-label="Ver detalle"
                    >
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination (mock) */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredMessages.length} de {messages.length} mensajes
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Anterior
          </Button>
          <Button variant="outline" size="sm">
            Siguiente
          </Button>
        </div>
      </div>

      {/* Modal Detalle (cuando se presiona 👁) */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground">Detalle de auditoría</p>
                <p className="text-xs text-muted-foreground">
                  msg-{selected.id} • {selected.type === 'chat' ? 'Chat' : 'Grupo'} •{' '}
                  {selected.encrypted ? 'E2E' : 'No cifrado'}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-foreground/60 hover:text-foreground"
                aria-label="Cerrar"
              >
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
                  <p className="text-xs text-muted-foreground">
                    {selected.type === 'chat' ? 'Destinatario' : 'Grupo'}
                  </p>
                  <p className="font-medium text-foreground">{selected.destination}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Conversation ID</p>
                  <p className="font-mono text-xs text-foreground">{selected.conversationId}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Timestamp</p>
                  <p className="font-medium text-foreground">{selected.timestamp}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Dispositivo</p>
                  <p className="font-medium text-foreground">{selected.device}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">IP</p>
                  <p className="font-medium text-foreground">{selected.ip}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border p-3">
                <p className="text-sm font-semibold text-foreground mb-2">Eventos</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                    <span className="text-foreground">Creado / Enviado</span>
                    <span className="text-muted-foreground text-xs">{selected.timestamp}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                    <span className="text-foreground">Entregado</span>
                    <span className="text-muted-foreground text-xs">
                      {selected.deliveredAt ?? '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                    <span className="text-foreground">Visto</span>
                    <span className="text-muted-foreground text-xs">{selected.seenAt ?? '—'}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-3">
                  * El contenido del mensaje no se muestra por cifrado E2E.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
