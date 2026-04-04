'use client'

import { X, Eye } from 'lucide-react'
import { State } from '@/contexts/AppContext'
import { useApp } from '@/contexts/AppContext'

export function ViewStateModal({
  isOpen,
  onClose,
  state,
}: {
  isOpen: boolean
  onClose: () => void
  state: State | null
}) {
  const { currentUser, contacts } = useApp()

  if (!isOpen || !state) return null

  const isImage =
    state.type === 'image' &&
    typeof state.content === 'string' &&
    state.content.startsWith('data:image')

  const isMyState = state.userId === currentUser?.id

  const viewers = state.viewedBy.map((id) => {
    const contact = contacts.find((c) => c.id === id)
    return (
      contact || {
        id,
        name: `Usuario ${id}`,
        status: 'Disponible',
        photo: null,
      }
    )
  })

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="border-b border-border p-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-foreground">{state.userName}</p>
            <p className="text-xs text-muted-foreground">Estado</p>
          </div>
          <button onClick={onClose} className="text-foreground/60 hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {state.type === 'text' ? (
            <p className="text-sm text-foreground break-words">{state.content}</p>
          ) : isImage ? (
            <img
              src={state.content}
              alt="estado"
              className="w-full rounded-lg max-h-[60vh] object-cover"
            />
          ) : (
            <p className="text-sm text-muted-foreground">📷 Imagen</p>
          )}

          {/* 👁 Visualizaciones SOLO si es mi estado */}
          {isMyState && (
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
                <Eye className="w-4 h-4" />
                {viewers.length} visualizaciones
              </div>

              {viewers.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nadie ha visto este estado aún
                </p>
              ) : (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {viewers.map((viewer) => (
                    <div
                      key={viewer.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-muted"
                    >
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                        {viewer.photo ? (
                          <img
                            src={viewer.photo}
                            alt={viewer.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          viewer.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-black">{viewer.name}</p>

                        <p className="text-[10px] text-muted-foreground">
                          {viewer.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
