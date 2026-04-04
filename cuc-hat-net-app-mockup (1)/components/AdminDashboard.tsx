'use client'

import { useApp } from '@/contexts/AppContext'
import { LogOut, Users, MessageSquare, Settings, Lock, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AdminDashboardView from './admin/AdminDashboardView'
import AdminUsersView from './admin/AdminUsersView'
import AdminGroupsView from './admin/AdminGroupsView'
import AdminMessagesView from './admin/AdminMessagesView'
import AdminConfigView from './admin/AdminConfigView'
import AdminSecurityView from './admin/AdminSecurityView'

export function AdminDashboard() {
  const { adminTab, setAdminTab, setCurrentView, setIsAdmin, showToast } = useApp()

  const handleLogout = () => {
    setCurrentView('landing')
    setIsAdmin(false)
    showToast('Sesión administrativa cerrada', 'info')
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-primary-foreground flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-primary/30">
          <h1 className="text-xl font-bold">CUChatNet Admin</h1>
          <p className="text-xs opacity-80 mt-1">Panel de Control</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setAdminTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${adminTab === 'dashboard' ? 'bg-primary/30' : 'hover:bg-primary/20'}`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setAdminTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${adminTab === 'users' ? 'bg-primary/30' : 'hover:bg-primary/20'}`}
          >
            <Users className="w-5 h-5" />
            <span>Usuarios</span>
          </button>
          <button
            onClick={() => setAdminTab('groups')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${adminTab === 'groups' ? 'bg-primary/30' : 'hover:bg-primary/20'}`}
          >
            <Users className="w-5 h-5" />
            <span>Grupos</span>
          </button>
          <button
            onClick={() => setAdminTab('messages')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${adminTab === 'messages' ? 'bg-primary/30' : 'hover:bg-primary/20'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Mensajes</span>
          </button>
          <button
            onClick={() => setAdminTab('config')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${adminTab === 'config' ? 'bg-primary/30' : 'hover:bg-primary/20'}`}
          >
            <Settings className="w-5 h-5" />
            <span>Configuración</span>
          </button>
          <button
            onClick={() => setAdminTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${adminTab === 'security' ? 'bg-primary/30' : 'hover:bg-primary/20'}`}
          >
            <Lock className="w-5 h-5" />
            <span>Seguridad</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-primary/30">
          <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-secondary hover:bg-secondary/20">
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 bg-card border-b border-border flex items-center px-6 justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {adminTab === 'dashboard' && 'Dashboard'}
            {adminTab === 'users' && 'Gestión de Usuarios'}
            {adminTab === 'groups' && 'Gestión de Grupos'}
            {adminTab === 'messages' && 'Auditoría de Mensajes'}
            {adminTab === 'config' && 'Configuración del Sistema'}
            {adminTab === 'security' && 'Seguridad y Bitácora'}
          </h2>
          <div className="text-xs text-muted-foreground">Administrador · Sesión activa</div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {adminTab === 'dashboard' && <AdminDashboardView />}
          {adminTab === 'users' && <AdminUsersView />}
          {adminTab === 'groups' && <AdminGroupsView />}
          {adminTab === 'messages' && <AdminMessagesView />}
          {adminTab === 'config' && <AdminConfigView />}
          {adminTab === 'security' && <AdminSecurityView />}
        </div>
      </div>
    </div>
  )
}
