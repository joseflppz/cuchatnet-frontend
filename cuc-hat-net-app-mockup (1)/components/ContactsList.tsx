'use client'

import { useApp } from '@/contexts/AppContext'
import { Search, MessageCircle, Users, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreateGroupModal } from '@/components/modals/CreateGroupModal'
import { ViewContactModal } from '@/components/modals/ViewContactModal'

export default function ContactsList() {
  const { contacts, setContacts, createDirectChat, showToast } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleStartChat = (contactId: string, contactName: string) => {
    const contact = contacts.find((c) => c.id === contactId)
    createDirectChat(contactId, contactName, contact?.photo)
    showToast(`Chat con ${contactName} creado`, 'success')
  }

  const handleSyncContacts = () => {
    setSyncing(true)
    setTimeout(() => {
      const updatedContacts = contacts.map((c) => ({ ...c, fromAgenda: true }))
      setContacts(updatedContacts)
      setSyncing(false)
      showToast('Contactos sincronizados correctamente', 'success')
    }, 1500)
  }

  const handleSelectContact = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    )
  }

  const handleCreateGroupClick = () => {
    if (selectedContacts.length === 0) {
      showToast('Selecciona al menos un contacto', 'error')
      return
    }
    setShowGroupModal(true)
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-10 space-y-4 rounded-2xl bg-gradient-to-b from-[#0A2E6D]/70 to-[#031028]/80 shadow-md ring-1 ring-white/10">
        <div className="text-4xl">👥</div>
        <p className="font-semibold text-white">Sin contactos</p>
        <p className="text-sm text-white/70">Sincroniza tus contactos para comenzar</p>
        <Button
          onClick={handleSyncContacts}
          className="bg-[#E21B23] hover:bg-[#E21B23]/90 text-white shadow-md shadow-[#E21B23]/20 rounded-xl transition-all duration-200"
        >
          Sincronizar Contactos
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-2xl bg-gradient-to-b from-[#0A2E6D]/90 via-[#061a3d]/95 to-[#031028]/95 p-3 md:p-4 shadow-lg ring-1 ring-white/10">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar contacto..."
          className="w-full pl-9 pr-3 py-2.5 bg-white/5 text-white placeholder:text-white/50 rounded-xl border border-white/10 hover:border-white/20 shadow-md backdrop-blur-md outline-none transition-all duration-200 focus:ring-2 focus:ring-[#E21B23]/40 focus:border-[#E21B23]/50"
        />
      </div>

      {/* Sync & Create Group Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleSyncContacts}
          disabled={syncing}
          variant="outline"
          className="flex-1 text-white/90 border-white/15 bg-white/5 hover:bg-white/10 hover:text-white shadow-md rounded-xl transition-all duration-200 disabled:opacity-60 disabled:hover:bg-white/5"
        >
          {syncing ? 'Sincronizando...' : '🔄 Sincronizar'}
        </Button>
        {selectedContacts.length > 0 && (
          <Button
            onClick={handleCreateGroupClick}
            className="flex-1 bg-[#E21B23] hover:bg-[#E21B23]/90 text-white shadow-md shadow-[#E21B23]/20 rounded-xl transition-all duration-200"
          >
            👥 Grupo ({selectedContacts.length})
          </Button>
        )}
      </div>

      {/* Contacts List */}
      <div className="space-y-2">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer backdrop-blur-md shadow-md ${selectedContacts.includes(contact.id)
                ? 'bg-white/10 border-[#E21B23]/40 shadow-lg shadow-black/20'
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-lg'
              }`}
            onClick={() => handleSelectContact(contact.id)}
          >
            <div className="flex items-center gap-3">
              {selectedContacts.includes(contact.id) && (
                <div className="w-4 h-4 rounded-md bg-[#E21B23] flex items-center justify-center shadow-sm ring-1 ring-white/10">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              {!selectedContacts.includes(contact.id) && (
                <div className="w-4 h-4 rounded-md border-2 border-white/20" />
              )}

              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E21B23]/25 via-white/10 to-[#0A2E6D]/60 text-white flex items-center justify-center text-lg font-semibold flex-shrink-0 shadow-md ring-1 ring-white/15">
                {contact.photo}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-white truncate">{contact.name}</p>
                  {contact.fromAgenda && (
                    <span className="text-[11px] bg-white/10 text-white/90 px-2 py-0.5 rounded-full ring-1 ring-white/10">
                      Agenda
                    </span>
                  )}
                </div>
                {contact.description && (
                  <p className="text-xs text-white/80 truncate">{contact.description}</p>
                )}
                <p className="text-xs text-white/60">{contact.phone}</p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedContact(contact.id)
                  setShowContactModal(true)
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 flex-shrink-0 text-white/80 hover:text-white shadow-sm"
              >
                👤
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleStartChat(contact.id, contact.name)
                }}
                className="p-2 hover:bg-[#E21B23] hover:text-white rounded-lg transition-all duration-200 flex-shrink-0 text-white/90 shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <CreateGroupModal
        isOpen={showGroupModal}
        onClose={() => {
          setShowGroupModal(false)
          setSelectedContacts([])
        }}
        contacts={contacts.filter((c) => selectedContacts.includes(c.id))}
      />

      <ViewContactModal
        isOpen={showContactModal}
        onClose={() => {
          setShowContactModal(false)
          setSelectedContact(null)
        }}
        contact={contacts.find((c) => c.id === selectedContact) || null}
      />
    </div>
  )
}
