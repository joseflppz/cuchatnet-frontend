'use client'

import { X } from 'lucide-react'
import { State, Contact } from '@/contexts/AppContext'

interface StateViewersModalProps {
  isOpen: boolean
  onClose: () => void
  state: State | null
  contacts: Contact[]
}

export function StateViewersModal({ isOpen, onClose, state, contacts }: StateViewersModalProps) {
  if (!isOpen || !state) return null

  const viewers = state.viewedBy.map((id) => {
    const contact = contacts.find((c) => c.id === id)

    return contact || {
      id,
      name: `Usuario ${id}`,
      status: 'Disponible',
      photo: null,
    }
  })


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border p-4 flex items-center justify-between">
          <h2 className="font-bold text-lg text-foreground">
            Vistas ({viewers.length})
          </h2>
          <button onClick={onClose} className="text-foreground/60 hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {viewers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nadie ha visto este estado aún</p>
          ) : (
            viewers.map((contact) => (
              <div key={contact?.id} className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg">
                <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm">
                  {contact?.photo ? (
                    <img src={contact.photo} alt={contact.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    contact?.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black">
                    {contact?.name}
                  </p>

                  <p className="text-xs text-muted-foreground">{contact?.status}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
