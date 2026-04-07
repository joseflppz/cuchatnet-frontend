'use client'

import { useApp } from '@/contexts/AppContext'
import { Lock, Bell, Binary as Privacy, FileText, LogOut, User, Shield } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'

type StatusType = 'available' | 'busy' | 'away'
type Section = 'profile' | 'security' | 'privacy' | 'notifications' | 'about'

export default function SettingsScreen() {
  // 1. Extraemos logout del contexto
  const { currentUser, setCurrentUser, setCurrentView, showToast, logout } = useApp()

  const [activeSection, setActiveSection] = useState<Section>('profile')

  // Perfil (Estado local para edición)
  const [description, setDescription] = useState<string>(currentUser?.description || '')
  const [status, setStatus] = useState<StatusType>((currentUser?.status as StatusType) || 'available')
  const [photo, setPhoto] = useState<string | null>((currentUser?.photo as string) || null)

  // Seguridad
  const [autoRenewKeys, setAutoRenewKeys] = useState(false)
  const [e2eEnabled, setE2eEnabled] = useState(true)
  const [deviceVerified, setDeviceVerified] = useState(true)

  const displayName = useMemo(() => {
    return (currentUser as any)?.userName || (currentUser as any)?.name || (currentUser as any)?.nombre || 'Usuario';
  }, [currentUser]);

  const displayInitial = useMemo(() => {
    return (displayName.charAt(0) || 'U').toUpperCase();
  }, [displayName]);

  const verificationCode = useMemo(() => {
    const suffix = Math.random().toString(36).slice(2, 11).toUpperCase()
    return `CUC-${suffix}`
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const savedSecurity = localStorage.getItem('cuchatnet_security_settings')
      if (savedSecurity) {
        const parsed = JSON.parse(savedSecurity)
        if (typeof parsed.autoRenewKeys === 'boolean') setAutoRenewKeys(parsed.autoRenewKeys)
        if (typeof parsed.e2eEnabled === 'boolean') setE2eEnabled(parsed.e2eEnabled)
        if (typeof parsed.deviceVerified === 'boolean') setDeviceVerified(parsed.deviceVerified)
      }
    } catch (e) {
      console.error("Error cargando configuración de seguridad", e)
    }
  }, [])

  const persistSecuritySettings = (next?: Partial<{ autoRenewKeys: boolean; e2eEnabled: boolean; deviceVerified: boolean }>) => {
    if (typeof window === 'undefined') return
    const payload = {
      autoRenewKeys: next?.autoRenewKeys ?? autoRenewKeys,
      e2eEnabled: next?.e2eEnabled ?? e2eEnabled,
      deviceVerified: next?.deviceVerified ?? deviceVerified,
    }
    localStorage.setItem('cuchatnet_security_settings', JSON.stringify(payload))
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setPhoto(base64)
      showToast('Previsualización de foto lista', 'info')
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = () => {
    if (!currentUser) {
      showToast('No hay usuario activo', 'error')
      return
    }

    const updatedUser = {
      ...currentUser,
      description: description.slice(0, 100),
      status: status,
      photo: photo || currentUser.photo,
    }

    setCurrentUser(updatedUser)
    showToast('Perfil actualizado correctamente', 'success')
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-3xl mx-auto pb-10">
        {/* Tabs de Navegación */}
        <div className="bg-card border-b border-border sticky top-0 z-10">
          <div className="flex overflow-x-auto no-scrollbar">
            {[
              { id: 'profile', icon: User, label: 'Perfil' },
              { id: 'security', icon: Shield, label: 'Seguridad' },
              { id: 'privacy', icon: Privacy, label: 'Privacidad' },
              { id: 'notifications', icon: Bell, label: 'Notificaciones' },
              { id: 'about', icon: FileText, label: 'Acerca de' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as Section)}
                className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeSection === tab.id
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* SECCIÓN PERFIL */}
          {activeSection === 'profile' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <h3 className="text-xl font-bold text-foreground">Configuración de Perfil</h3>
              
              <div className="flex items-center gap-6 p-6 border border-border rounded-3xl bg-card shadow-sm">
                <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-4xl font-bold relative group border-2 border-primary/20 overflow-hidden">
                  {photo || currentUser?.photo ? (
                    <img src={photo || (currentUser?.photo as string)} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    displayInitial
                  )}
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all">
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    <span className="text-white text-[10px] font-bold uppercase">Cambiar</span>
                  </label>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-bold text-foreground truncate">{displayName}</h4>
                  <p className="text-sm text-muted-foreground">{currentUser?.phone || 'Sin número vinculado'}</p>
                  <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {status === 'available' ? '● Disponible' : status === 'busy' ? '● Ocupado' : '● Ausente'}
                  </div>
                </div>
              </div>

              <div className="p-6 border border-border rounded-3xl bg-card shadow-sm space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Estado de disponibilidad</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StatusType)}
                    className="w-full border border-border rounded-xl px-4 py-3 text-foreground bg-background focus:ring-2 focus:ring-primary outline-none transition-all"
                  >
                    <option value="available">Disponible</option>
                    <option value="busy">Ocupado</option>
                    <option value="away">Ausente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Descripción corta</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 100))}
                    placeholder="Escribe algo sobre ti..."
                    className="w-full border border-border rounded-xl px-4 py-3 text-foreground bg-background focus:ring-2 focus:ring-primary outline-none resize-none h-24 transition-all"
                  />
                  <p className="text-right text-xs text-muted-foreground mt-1">{description.length}/100</p>
                </div>

                <div className="pt-2 space-y-3">
                  <Button onClick={handleSaveProfile} className="w-full py-6 text-md font-bold rounded-2xl shadow-lg shadow-primary/20">
                    Guardar cambios en el perfil
                  </Button>
                  
                  {/* BOTÓN ACTUALIZADO CON LOGOUT DEL CONTEXTO */}
                  <Button 
                    variant="ghost" 
                    onClick={logout} 
                    className="w-full text-destructive hover:bg-destructive/10 rounded-2xl gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión de {displayName}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN SEGURIDAD */}
          {activeSection === 'security' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <h3 className="text-xl font-bold text-foreground">Seguridad y Cifrado</h3>
              
              <div className="p-5 border border-border rounded-3xl bg-card space-y-4">
                <div className="flex items-center gap-4 text-primary bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <Lock className="w-6 h-6" />
                  <p className="text-sm font-medium">Tus conversaciones utilizan cifrado de extremo a extremo (E2EE) basado en el protocolo Signal.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-2">
                    <div>
                      <p className="font-bold">Código de verificación</p>
                      <p className="text-xs text-muted-foreground">Compara este código con tu contacto para validar el cifrado.</p>
                    </div>
                    <div className="bg-muted px-3 py-1 rounded-lg font-mono text-sm font-bold border border-border">
                      {verificationCode}
                    </div>
                  </div>

                  <hr className="border-border" />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold">Renovación automática</p>
                      <p className="text-xs text-muted-foreground">Rotar claves de cifrado cada 30 días.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={autoRenewKeys}
                      onChange={(e) => {
                        setAutoRenewKeys(e.target.checked)
                        persistSecuritySettings({ autoRenewKeys: e.target.checked })
                        showToast('Preferencia de llaves actualizada', 'info')
                      }}
                      className="w-5 h-5 accent-primary cursor-pointer" 
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 border border-border rounded-3xl bg-card">
                 <h4 className="font-bold mb-3">Información Técnica</h4>
                 <div className="space-y-2 text-xs text-muted-foreground">
                    <p>• Los mensajes se cifran localmente antes de ser enviados.</p>
                    <p>• El servidor de CUChatNet nunca tiene acceso a tus claves privadas.</p>
                    <p>• ID de Dispositivo: <span className="font-mono text-foreground">dev_2026_x86_hash</span></p>
                 </div>
              </div>
            </div>
          )}

          {/* OTRAS SECCIONES */}
          {activeSection === 'privacy' && (
            <div className="p-10 text-center text-muted-foreground border border-dashed border-border rounded-3xl">
              Configuración de privacidad avanzada en desarrollo.
            </div>
          )}

          {activeSection === 'about' && (
            <div className="space-y-6 text-center py-10">
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-black italic">CUChatNet <span className="text-primary">v1.0</span></h2>
                <p className="max-w-xs mx-auto text-sm text-muted-foreground">
                    Proyecto de mensajería segura para la comunidad estudiantil del Colegio Universitario de Cartago.
                </p>
                <div className="pt-6">
                    <Button variant="link" className="text-primary">Términos y Condiciones</Button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}