'use client'

import { useApp } from '@/contexts/AppContext'
import { Button } from '@/components/ui/button'
import { LogOut, Menu, X, Plus, Settings } from 'lucide-react'
import { useState } from 'react'
import ChatList from './ChatList'
import GroupsList from './GroupsList'
import ContactsList from './ContactsList'
import StatesList from './StatesList'
import SettingsScreen from './SettingsScreen'
import ChatWindow from './ChatWindow'
import { CreateGroupModal } from '@/components/modals/CreateGroupModal'
import { CreateStateModal } from '@/components/modals/CreateStateModal'

type ClientTab = 'chats' | 'groups' | 'contacts' | 'states' | 'settings'

export function ChatInterface() {
  const { currentUser, clientTab, setClientTab, setCurrentView, contacts, showToast } = useApp()

  // En móvil empieza cerrado, en desktop siempre visible por clases lg:
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [showGroupModal, setShowGroupModal] = useState(false)
  const [showStateModal, setShowStateModal] = useState(false)

  const tabTitle =
    clientTab === 'chats'
      ? 'Chats'
      : clientTab === 'groups'
        ? 'Grupos'
        : clientTab === 'contacts'
          ? 'Contactos'
          : clientTab === 'states'
            ? 'Estados'
            : 'Ajustes'

  const selectTab = (tab: ClientTab) => {
    setClientTab(tab as any)
    setSidebarOpen(false) // cerrar drawer en móvil
  }

  const logout = () => {
    setCurrentView('landing')
    showToast('Sesión cerrada', 'info')
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden relative">
      {/* Overlay móvil */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar / Drawer */}
      <aside
        className={[
          // mobile drawer
          'fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[320px]',
          'bg-primary text-primary-foreground flex flex-col',
          'transform transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          // desktop
          'lg:static lg:translate-x-0 lg:z-auto lg:w-80',
        ].join(' ')}
      >
        {/* Header */}
        <div className="p-4 border-b border-primary/30">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">CUChatNet</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 hover:bg-primary/20 rounded"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3 bg-primary/20 rounded-lg p-3">
            <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold overflow-hidden">
              {currentUser?.photo ? (
                <img src={currentUser.photo} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                currentUser?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{currentUser?.name}</p>
              <p className="text-xs opacity-80 capitalize truncate">{currentUser?.status}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-4 border-b border-primary/30">
            <button
              onClick={() => selectTab('chats')}
              className={`px-2 py-3 text-xs sm:text-sm font-medium transition-colors ${clientTab === 'chats' ? 'bg-primary/30 border-b-2 border-secondary' : 'hover:bg-primary/20'
                }`}
            >
              Chats
            </button>
            <button
              onClick={() => selectTab('groups')}
              className={`px-2 py-3 text-xs sm:text-sm font-medium transition-colors ${clientTab === 'groups' ? 'bg-primary/30 border-b-2 border-secondary' : 'hover:bg-primary/20'
                }`}
            >
              Grupos
            </button>
            <button
              onClick={() => selectTab('contacts')}
              className={`px-2 py-3 text-xs sm:text-sm font-medium transition-colors ${clientTab === 'contacts' ? 'bg-primary/30 border-b-2 border-secondary' : 'hover:bg-primary/20'
                }`}
            >
              Contactos
            </button>
            <button
              onClick={() => selectTab('states')}
              className={`px-2 py-3 text-xs sm:text-sm font-medium transition-colors ${clientTab === 'states' ? 'bg-primary/30 border-b-2 border-secondary' : 'hover:bg-primary/20'
                }`}
            >
              Estados
            </button>
          </div>

          {/* Panel listado */}
          <div className="p-4">
            {clientTab === 'chats' && <ChatList />}
            {clientTab === 'groups' && <GroupsList />}
            {clientTab === 'contacts' && <ContactsList />}
            {clientTab === 'states' && <StatesList />}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-primary/30 space-y-2">
          <Button
            onClick={() => selectTab('settings')}
            variant="ghost"
            className="w-full justify-start text-primary-foreground hover:bg-primary/20"
          >
            <Settings className="w-4 h-4 mr-2" />
            Ajustes
          </Button>

          <Button
            onClick={logout}
            variant="ghost"
            className="w-full justify-start text-secondary hover:bg-secondary/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="bg-card border-b border-border h-16 flex items-center px-4 justify-between gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-muted rounded"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h2 className="text-lg font-semibold text-foreground truncate">{tabTitle}</h2>

          <div className="flex items-center gap-2">
            {clientTab === 'groups' && (
              <Button
                onClick={() => setShowGroupModal(true)}
                size="sm"
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="w-4 h-4" />
                Crear
              </Button>
            )}

            {clientTab === 'states' && (
              <Button
                onClick={() => setShowStateModal(true)}
                size="sm"
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="w-4 h-4" />
                Crear
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {clientTab === 'settings' ? <SettingsScreen /> : <ChatWindow />}
        </div>
      </div>

      {/* Modals */}
      <CreateGroupModal isOpen={showGroupModal} onClose={() => setShowGroupModal(false)} contacts={contacts} />
      <CreateStateModal isOpen={showStateModal} onClose={() => setShowStateModal(false)} />
    </div>
  )
}
