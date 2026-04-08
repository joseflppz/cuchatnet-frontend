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
  // 1. Extraemos 'logout' del useApp()
  const { currentUser, clientTab, setClientTab, logout, contacts, showToast } = useApp()

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
    setSidebarOpen(false) 
  }

  // 2. Reemplazamos la función local por la versión que usa el logout del context
  const handleLogout = () => {
    logout() // Esta función limpia localStorage y estados globales
    showToast('Sesión cerrada correctamente', 'info')
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
          'fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[320px]',
          'bg-primary text-primary-foreground flex flex-col',
          'transform transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
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
            <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold overflow-hidden border border-primary/10">
              {currentUser?.photo &&
              (currentUser.photo.startsWith('http') ||
                currentUser.photo.startsWith('data:image') ||
                currentUser.photo.startsWith('/')) ? (
                <img
                  src={currentUser.photo}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>
                  {currentUser?.photo?.length === 1
                    ? currentUser.photo
                    : currentUser?.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{currentUser?.name}</p>
              <p className="text-xs opacity-80 capitalize truncate">
                {currentUser?.status || 'Disponible'}
              </p>
            </div>
          </div>
          </div>

        {/* Tabs */}
        <nav className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-4 border-b border-primary/30">
            {['chats', 'groups', 'contacts', 'states'].map((tab) => (
              <button
                key={tab}
                onClick={() => selectTab(tab as ClientTab)}
                className={`px-2 py-3 text-xs sm:text-sm font-medium transition-colors capitalize ${clientTab === tab ? 'bg-primary/30 border-b-2 border-secondary' : 'hover:bg-primary/20'
                  }`}
              >
                {tab === 'states' ? 'Estados' : tab}
              </button>
            ))}
          </div>

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

          {/* 3. Botón de Cerrar Sesión actualizado */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-secondary hover:bg-secondary/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
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
            {(clientTab === 'groups' || clientTab === 'states') && (
              <Button
                onClick={() => clientTab === 'groups' ? setShowGroupModal(true) : setShowStateModal(true)}
                size="sm"
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="w-4 h-4" />
                Crear
              </Button>
            )}
          </div>
        </div>

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