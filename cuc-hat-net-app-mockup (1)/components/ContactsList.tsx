'use client'

import { useApp } from '@/contexts/AppContext'
import { Search, MessageCircle, UserPlus, Check, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreateGroupModal } from '@/components/modals/CreateGroupModal'
import { ViewContactModal } from '@/components/modals/ViewContactModal'
import { addContact } from '@/lib/api'

export default function ContactsList() {
  const { contacts, setContacts, createDirectChat, showToast } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('') 
  const [isAdding, setIsAdding] = useState(false)

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    contact.phone?.includes(searchTerm)
  )

  const handleAddContact = async () => {
    if (!phoneNumber) return;
    
    setIsAdding(true);
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      // Corrección: Aseguramos que tomamos el ID correcto (id o usuarioId)
      const userId = user?.id || user?.usuarioId;

      if (!userId) {
        showToast('Debes estar logueado para agregar contactos', 'error');
        return;
      }

      // Enviamos como número para cumplir con el contrato de la API
      await addContact(Number(userId), phoneNumber);
      
      showToast('Contacto agregado con éxito', 'success');
      setShowAddForm(false);
      setPhoneNumber('');
      handleSyncContacts(); 
    } catch (error: any) {
      // Corrección: Evitamos enviar JSX si el context solo acepta strings
      showToast('Número no registrado o error de conexión. Verifica el teléfono.', 'error');
    } finally {
      setIsAdding(false);
    }
  }

  const handleSyncContacts = async () => {
    try {
      setSyncing(true)
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.id || user?.usuarioId;

      if (!userId) {
        showToast('Usuario no identificado', 'error')
        return
      }

      const res = await fetch(`https://localhost:7086/api/contactos/${userId}`, {
        cache: "no-store"
      })
      if (!res.ok) throw new Error('Error cargando contactos')

      const data = await res.json()
      const mappedContacts = data.map((c: any) => ({
        id: c.id.toString(),
        name: c.name,
        phone: c.phone,
        photo: c.photo || c.name.charAt(0).toUpperCase(),
        description: c.description,
        status: c.status,
        fromAgenda: c.fromAgenda
      }))

      setContacts(mappedContacts)
    } catch (error) {
      showToast('Error al sincronizar la lista', 'error')
    } finally {
      setSyncing(false)
    }
  }

  const handleStartChat = async (contactId: string, contactName: string) => {
    const contact = contacts.find((c) => c.id === contactId)
    // Casting 'as any' para acceder a .message si la interfaz no está definida
    const result = await createDirectChat(contactId, contactName, contact?.photo) as any;
    
    if (result?.message?.includes("existía")) {
        showToast(`Abriendo chat existente con ${contactName}`, 'info')
    } else {
        showToast(`Conversación iniciada con ${contactName}`, 'success')
    }
  }

  const handleSelectContact = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    )
  }

  return (
    <div className="space-y-3 rounded-2xl bg-gradient-to-b from-[#0A2E6D]/90 via-[#061a3d]/95 to-[#031028]/95 p-3 md:p-4 shadow-lg ring-1 ring-white/10">
      
      {!showAddForm ? (
        <Button
          onClick={() => setShowAddForm(true)}
          className="w-full gap-2 bg-[#E21B23] hover:bg-[#E21B23]/90 text-white shadow-md shadow-[#E21B23]/20 rounded-xl transition-all duration-200"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Contacto
        </Button>
      ) : (
        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/60 uppercase">Agregar por Teléfono</span>
            <button onClick={() => setShowAddForm(false)} className="text-white/40 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ej: 88887777"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="flex-1 px-3 py-2 bg-black/20 text-white text-sm rounded-lg border border-white/10 outline-none focus:ring-1 focus:ring-[#E21B23]"
            />
            <Button 
              onClick={handleAddContact}
              disabled={isAdding || !phoneNumber}
              className="bg-[#E21B23] hover:bg-[#E21B23]/90 h-9 px-4"
            >
              {isAdding ? '...' : 'Agregar'}
            </Button>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar contacto o teléfono..."
          className="w-full pl-9 pr-3 py-2.5 bg-white/5 text-white placeholder:text-white/50 rounded-xl border border-white/10 outline-none focus:ring-2 focus:ring-[#E21B23]/40"
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleSyncContacts}
          disabled={syncing}
          variant="outline"
          className="flex-1 text-white/90 border-white/15 bg-white/5 hover:bg-white/10 shadow-md rounded-xl transition-all duration-200"
        >
          {syncing ? 'Cargando...' : '🔄 Sincronizar'}
        </Button>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer backdrop-blur-md shadow-md ${
              selectedContacts.includes(contact.id)
                ? 'bg-white/10 border-[#E21B23]/40'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
            onClick={() => handleSelectContact(contact.id)}
          >
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-md border-2 transition-colors ${
                selectedContacts.includes(contact.id) ? 'bg-[#E21B23] border-[#E21B23]' : 'border-white/20'
              }`}>
                {selectedContacts.includes(contact.id) && <Check className="w-3 h-3 text-white" />}
              </div>

              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E21B23]/25 via-white/10 to-[#0A2E6D]/60 text-white flex items-center justify-center text-lg font-semibold flex-shrink-0 ring-1 ring-white/15">
                {contact.photo?.length === 1 ? contact.photo : contact.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white truncate">{contact.name}</p>
                <p className="text-xs text-white/60">{contact.phone}</p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleStartChat(contact.id, contact.name)
                }}
                className="p-2 hover:bg-[#E21B23] hover:text-white rounded-lg transition-all duration-200 text-white/90"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <CreateGroupModal
        isOpen={showGroupModal}
        onClose={() => { setShowGroupModal(false); setSelectedContacts([]); }}
        contacts={contacts.filter((c) => selectedContacts.includes(c.id))}
      />

      <ViewContactModal
        isOpen={showContactModal}
        onClose={() => { setShowContactModal(false); setSelectedContact(null); }}
        contact={contacts.find((c) => c.id === selectedContact) || null}
      />
    </div>
  )
}