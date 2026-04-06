'use client'

import { useApp } from '@/contexts/AppContext'
import { LogOut, Users, MessageSquare, Settings, Lock, BarChart3, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AdminDashboardView from './admin/AdminDashboardView'
import AdminUsersView from './admin/AdminUsersView'
import AdminGroupsView from './admin/AdminGroupsView'
import AdminMessagesView from './admin/AdminMessagesView'
import AdminConfigView from './admin/AdminConfigView'
import AdminSecurityView from './admin/AdminSecurityView'
import AdminRolesView from './admin/AdminRolesView'

export function AdminDashboard() {
  const { adminTab, setAdminTab, setCurrentView, setIsAdmin, showToast } = useApp()

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_nombre')
    setCurrentView('landing')
    setIsAdmin(false)
    showToast('Sesión administrativa cerrada', 'info')
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-primary-foreground flex flex-col">
        <div className="p-4 border-b border-primary/30">
          <h1 className="text-xl font-bold">CUChatNet Admin</h1>
          <p className="text-xs opacity-80 mt-1">Panel de Control</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { tab: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { tab: 'users', label: 'Usuarios', icon: Users },
            { tab: 'groups', label: 'Grupos', icon: Users },
            { tab: 'messages', label: 'Mensajes', icon: MessageSquare },
            { tab: 'roles', label: 'Roles', icon: Shield },
            { tab: 'config', label: 'Configuración', icon: Settings },
            { tab: 'security', label: 'Seguridad', icon: Lock },
          ].map(({ tab, label, icon: Icon }) => (
            <button
              key={tab}
              onClick={() => setAdminTab(tab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                adminTab === tab ? 'bg-primary/30' : 'hover:bg-primary/20'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-primary/30">
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-16 bg-card border-b border-border flex items-center px-6 justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {adminTab === 'dashboard' && 'Dashboard'}
            {adminTab === 'users' && 'Gestión de Usuarios'}
            {adminTab === 'groups' && 'Gestión de Grupos'}
            {adminTab === 'messages' && 'Auditoría de Mensajes'}
            {adminTab === 'roles' && 'Gestión de Roles'}
            {adminTab === 'config' && 'Configuración del Sistema'}
            {adminTab === 'security' && 'Seguridad y Bitácora'}
          </h2>
          <div className="text-xs text-muted-foreground">Administrador · Sesión activa</div>
        </div>

        <div className="flex-1 overflow-auto">
          {adminTab === 'dashboard' && <AdminDashboardView />}
          {adminTab === 'users' && <AdminUsersView />}
          {adminTab === 'groups' && <AdminGroupsView />}
          {adminTab === 'messages' && <AdminMessagesView />}
          {adminTab === 'roles' && <AdminRolesView />}
          {adminTab === 'config' && <AdminConfigView />}
          {adminTab === 'security' && <AdminSecurityView />}
        </div>
      </div>
    </div>
  )
}