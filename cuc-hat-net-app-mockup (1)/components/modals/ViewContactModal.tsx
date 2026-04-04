'use client'

import { Contact } from '@/contexts/AppContext'
import { X } from 'lucide-react'

interface ViewContactModalProps {
  isOpen: boolean
  onClose: () => void
  contact: Contact | null
}

export function ViewContactModal({ isOpen, onClose, contact }: ViewContactModalProps) {
  if (!isOpen || !contact) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-sm w-full">
        <div className="sticky top-0 bg-white border-b border-border p-4 flex items-center justify-between">
          <h2 className="font-bold text-lg text-foreground">Perfil</h2>
          <button onClick={onClose} className="text-foreground/60 hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto text-5xl overflow-hidden">
            {contact.photo?.startsWith('data:') ? (
              <img src={contact.photo} alt={contact.name} className="w-full h-full object-cover" />
            ) : contact.photo ? (
              <span>{contact.photo}</span>
            ) : (
              <span>{contact.name.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold text-foreground">{contact.name}</h3>
            <p className="text-sm text-muted-foreground">{contact.phone}</p>
          </div>

          {contact.description && (
            <div className="bg-muted rounded-lg p-3 text-sm text-foreground">
              {contact.description}
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-foreground capitalize">{contact.status}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
