'use client'

import { useApp } from '@/contexts/AppContext'
import { Lock, Bell, Binary as Privacy, FileText, LogOut, User, Shield } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { apiGet, apiPut } from '@/lib/api-client'

type StatusType = 'available' | 'busy' | 'away'
type Section = 'profile' | 'security' | 'privacy' | 'notifications' | 'about'
type VisibilityOption = 'Todos' | 'Mis contactos' | 'Nadie'

function normalizeStatus(value: string | undefined): StatusType {
  if (value === 'busy' || value === 'away' || value === 'available') return value
  return 'available'
}

function visibilityValueToOption(value: number | undefined): VisibilityOption {
  switch (value) {
    case 2:
      return 'Todos'
    case 1:
      return 'Mis contactos'
    case 0:
    default:
      return 'Nadie'
  }
}

function visibilityOptionToValue(value: VisibilityOption): number {
  switch (value) {
    case 'Todos':
      return 2
    case 'Mis contactos':
      return 1
    case 'Nadie':
    default:
      return 0
  }
}

export default function SettingsScreen() {
  const { currentUser, setCurrentUser, setCurrentView, showToast } = useApp()

  const [activeSection, setActiveSection] = useState<Section>('profile')

  // Perfil
  const [description, setDescription] = useState<string>(currentUser?.description || '')
  const [status, setStatus] = useState<StatusType>(normalizeStatus(currentUser?.status as string | undefined))
  const [photo, setPhoto] = useState<string | null>((currentUser?.photo as string) || null)

  // Seguridad (solo lectura desde backend + visual local)
  const [autoRenewKeys, setAutoRenewKeys] = useState(false)
  const [e2eEnabled, setE2eEnabled] = useState(true)
  const [deviceVerified, setDeviceVerified] = useState(true)

  // Preferencias
  const [onlineVisibility, setOnlineVisibility] = useState<VisibilityOption>('Mis contactos')
  const [photoVisibility, setPhotoVisibility] = useState<VisibilityOption>('Mis contactos')
  const [statusVisibility, setStatusVisibility] = useState<VisibilityOption>('Mis contactos')
  const [confirmRead, setConfirmRead] = useState(true)
  const [notificationsEmail, setNotificationsEmail] = useState(true)
  const [notificationsPush, setNotificationsPush] = useState(true)
  const [notificationSound, setNotificationSound] = useState(true)
  const [vibrationEnabled, setVibrationEnabled] = useState(true)

  const preferencesInitialized = useRef(false)

  const verificationCode = useMemo(() => {
    const suffix = Math.random().toString(36).slice(2, 11).toUpperCase()
    return `CUC-${suffix}`
  }, [])

  useEffect(() => {
    if (!currentUser?.id) return

    let cancelled = false
    preferencesInitialized.current = false

    const loadSettings = async () => {
      try {
        const data = await apiGet<any>(`/api/ajustes/${currentUser.id}`)
        if (cancelled) return

        const perfil = data?.perfil
        const preferencias = data?.preferencias
        const seguridad = data?.seguridad

        if (perfil) {
          setDescription(perfil.description || '')
          setStatus(normalizeStatus(perfil.status))
          setPhoto(perfil.photoUrl || null)
        }

        if (preferencias) {
          setPhotoVisibility(visibilityValueToOption(preferencias.fotoPerfilVisible))
          setOnlineVisibility(visibilityValueToOption(preferencias.estadoVisible))
          setStatusVisibility(visibilityValueToOption(preferencias.ultimaVezVisible))
          setConfirmRead(!!preferencias.confirmacionesLectura)
          setNotificationsEmail(!!preferencias.notificacionesEmail)
          setNotificationsPush(!!preferencias.notificacionesPush)
          setNotificationSound(!!preferencias.sonidoNotificaciones)
        }

        if (seguridad) {
          setE2eEnabled(!!seguridad.requiereE2E)
          setDeviceVerified(!!seguridad.deteccionCambioDispositivo)
          setAutoRenewKeys((seguridad.rotacionClavesDias ?? 0) > 0)
        }

        preferencesInitialized.current = true
      } catch (error: any) {
        showToast(error.message || 'No se pudieron cargar los ajustes', 'error')
      }
    }

    loadSettings()

    return () => {
      cancelled = true
    }
  }, [currentUser?.id, showToast])

  // Guardado automático de preferencias
  useEffect(() => {
    if (!currentUser?.id) return
    if (!preferencesInitialized.current) return

    const timeout = setTimeout(async () => {
      try {
        await apiPut('/api/ajustes/preferencias', {
          usuarioId: currentUser.id,
          fotoPerfilVisible: visibilityOptionToValue(photoVisibility),
          estadoVisible: visibilityOptionToValue(onlineVisibility),
          ultimaVezVisible: visibilityOptionToValue(statusVisibility),
          confirmacionesLectura: confirmRead,
          notificacionesEmail: notificationsEmail,
          notificacionesPush: notificationsPush,
          sonidoNotificaciones: notificationSound,
        })
      } catch (error: any) {
        showToast(error.message || 'No se pudieron guardar las preferencias', 'error')
      }
    }, 400)

    return () => clearTimeout(timeout)
  }, [
    currentUser?.id,
    photoVisibility,
    onlineVisibility,
    statusVisibility,
    confirmRead,
    notificationsEmail,
    notificationsPush,
    notificationSound,
    showToast,
  ])

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setPhoto(base64)
      showToast('Foto lista para guardar', 'info')
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = async () => {
    if (!currentUser) {
      showToast('No hay usuario activo', 'error')
      return
    }

    try {
      const updated = await apiPut<any>('/api/ajustes/perfil', {
        usuarioId: currentUser.id,
        name: currentUser.name,
        description: description.slice(0, 100),
        photoUrl: photo || '',
        status,
      })

      const updatedUser = {
        ...currentUser,
        name: updated.name || currentUser.name,
        description: updated.description || undefined,
        status: (updated.status || status) as any,
        photo: updated.photoUrl || undefined,
      }

      setCurrentUser(updatedUser)
      if (typeof window !== 'undefined') {
        localStorage.setItem('cuchatnet_currentUser', JSON.stringify(updatedUser))
      }
      showToast('Perfil actualizado correctamente', 'success')
    } catch (error: any) {
      showToast(error.message || 'No se pudo actualizar el perfil', 'error')
    }
  }

  const displayInitial = (currentUser?.name?.charAt(0) || 'U').toUpperCase()

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-3xl mx-auto">
        <div className="bg-card border-b border-border sticky top-0 z-10">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveSection('profile')}
              className={`flex items-center gap-2 px-4 py-4 font-medium border-b-2 transition-colors ${
                activeSection === 'profile'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="w-4 h-4" />
              Perfil
            </button>

            <button
              onClick={() => setActiveSection('security')}
              className={`flex items-center gap-2 px-4 py-4 font-medium border-b-2 transition-colors ${
                activeSection === 'security'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Shield className="w-4 h-4" />
              Seguridad
            </button>

            <button
              onClick={() => setActiveSection('privacy')}
              className={`flex items-center gap-2 px-4 py-4 font-medium border-b-2 transition-colors ${
                activeSection === 'privacy'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Privacy className="w-4 h-4" />
              Privacidad
            </button>

            <button
              onClick={() => setActiveSection('notifications')}
              className={`flex items-center gap-2 px-4 py-4 font-medium border-b-2 transition-colors ${
                activeSection === 'notifications'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Bell className="w-4 h-4" />
              Notificaciones
            </button>

            <button
              onClick={() => setActiveSection('about')}
              className={`flex items-center gap-2 px-4 py-4 font-medium border-b-2 transition-colors ${
                activeSection === 'about'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="w-4 h-4" />
              Acerca de
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {activeSection === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Mi Perfil</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 border border-border rounded-2xl bg-card shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center text-3xl font-bold flex-shrink-0 overflow-hidden relative group">
                      {photo ? (
                        <img src={photo} alt={currentUser?.name || 'Usuario'} className="w-full h-full object-cover" />
                      ) : (
                        displayInitial
                      )}
                      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                        <span className="text-white text-xs font-medium">Cambiar</span>
                      </label>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{currentUser?.name || 'Usuario'}</p>
                      <p className="text-sm text-muted-foreground truncate">{currentUser?.phone || 'Sin teléfono'}</p>
                    </div>
                  </div>

                  <div className="p-4 border border-border rounded-2xl bg-card shadow-sm space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Estado</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as StatusType)}
                        className="w-full border border-border rounded-lg px-3 py-2 text-foreground bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="available">Disponible</option>
                        <option value="busy">Ocupado</option>
                        <option value="away">Ausente</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Descripción (máx 100 caracteres)
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value.slice(0, 100))}
                        placeholder="Cuéntale a tus amigos sobre ti..."
                        maxLength={100}
                        rows={3}
                        className="w-full border border-border rounded-lg px-3 py-2 text-foreground bg-background placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                      />
                      <p className="text-xs text-muted-foreground mt-1">{description.length}/100</p>
                    </div>

                    <Button
                      onClick={handleSaveProfile}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                    >
                      Guardar Cambios
                    </Button>

                    <Button
                      onClick={() => {
                        localStorage.removeItem('cuchatnet_currentUser')
                        localStorage.removeItem('cuchatnet_state')
                        setCurrentUser(null)
                        setCurrentView('landing')
                        showToast('Sesión cerrada', 'info')
                      }}
                      variant="outline"
                      className="w-full border-border text-foreground hover:bg-muted flex items-center justify-center gap-2 rounded-xl"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesión
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Cifrado de Extremo a Extremo</h3>

                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">Tus chats están protegidos</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Todos tus mensajes están cifrados con claves únicas por dispositivo.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-4 border border-border rounded-2xl bg-card shadow-sm">
                    <p className="font-medium text-foreground mb-2">Código de Seguridad</p>
                    <div className="bg-muted p-3 rounded font-mono text-sm text-center text-foreground mb-3">
                      {verificationCode}
                    </div>
                    <Button variant="outline" className="w-full bg-transparent" size="sm">
                      Compartir código de seguridad
                    </Button>

                    <p className="text-xs text-muted-foreground mt-2">
                      Las claves públicas se intercambian automáticamente al iniciar una conversación y garantizan la
                      autenticidad del contacto.
                    </p>
                  </div>

                  <div className="p-4 border border-border rounded-2xl bg-card shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Cifrado E2E habilitado</p>
                        <p className="text-sm text-muted-foreground">Requerido para enviar y recibir mensajes</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={e2eEnabled}
                        onChange={(e) => {
                          setE2eEnabled(e.target.checked)
                          showToast('Configuración visual actualizada', 'info')
                        }}
                        className="w-4 h-4 accent-primary"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Dispositivo verificado</p>
                        <p className="text-sm text-muted-foreground">Confirma que este equipo es de confianza</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={deviceVerified}
                        onChange={(e) => {
                          setDeviceVerified(e.target.checked)
                          showToast('Configuración visual actualizada', 'info')
                        }}
                        className="w-4 h-4 accent-primary"
                      />
                    </div>
                  </div>

                  <div className="p-4 border border-border rounded-2xl bg-card shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-foreground">Renovación Automática de Claves</p>
                      <input
                        type="checkbox"
                        checked={autoRenewKeys}
                        onChange={(e) => {
                          setAutoRenewKeys(e.target.checked)
                          showToast('Configuración visual actualizada', 'info')
                        }}
                        className="w-4 h-4 accent-primary"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Renueva tus claves de cifrado cada 30 días automáticamente.
                    </p>
                  </div>

                  <div className="p-4 border border-border rounded-2xl bg-card shadow-sm">
                    <p className="font-medium text-foreground mb-2">Claves por Dispositivo</p>
                    <p className="text-sm text-muted-foreground mb-3">Dispositivo actual: Mi Laptop (Windows 11)</p>
                    <p className="text-xs text-muted-foreground bg-muted p-2 rounded">ID: device-abc123xyz789</p>
                  </div>

                  <div className="p-4 border border-border rounded-2xl bg-card shadow-sm">
                    <p className="font-medium text-foreground mb-2">Cifrado Antes del Envío</p>
                    <p className="text-sm text-muted-foreground">
                      Los mensajes se cifran localmente en tu dispositivo antes de ser enviados al servidor.
                    </p>
                  </div>

                  <div className="p-4 border border-border rounded-2xl bg-card shadow-sm">
                    <p className="font-medium text-foreground mb-2">Transmisión Segura</p>
                    <p className="text-sm text-muted-foreground">
                      Los mensajes viajan cifrados durante toda la transmisión hasta el dispositivo del receptor.
                    </p>
                  </div>

                  <div className="p-4 border border-border rounded-2xl bg-card shadow-sm">
                    <p className="font-medium text-foreground mb-2">Descifrado Local</p>
                    <p className="text-sm text-muted-foreground">
                      Los mensajes solo pueden descifrarse en el dispositivo del receptor. El servidor únicamente
                      almacena contenido cifrado.
                    </p>
                  </div>

                  <div className="p-4 border border-border rounded-2xl bg-card shadow-sm">
                    <p className="font-medium text-foreground mb-2">Protección Integral</p>
                    <p className="text-sm text-muted-foreground">
                      Mensajes, llamadas y archivos están protegidos mediante cifrado de extremo a extremo.
                    </p>
                  </div>

                  <div className="p-4 border border-border rounded-2xl bg-card shadow-sm">
                    <p className="font-medium text-foreground mb-2">Bloqueo de Accesos</p>
                    <p className="text-sm text-muted-foreground">
                      Después de múltiples intentos fallidos, el sistema bloquea temporalmente el acceso para proteger tu cuenta.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Protección de Cambio de Dispositivo</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 shadow-sm">
                  <p className="text-sm text-yellow-700">
                    <strong>Alerta:</strong> Si intentas iniciar sesión desde un nuevo dispositivo, recibirás una notificación de seguridad.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Configuración de Privacidad</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border border-border rounded-2xl bg-card shadow-sm">
                    <div>
                      <p className="font-medium text-foreground">Quién puede verte en línea</p>
                      <p className="text-sm text-muted-foreground">Tus contactos</p>
                    </div>
                    <select
                      value={onlineVisibility}
                      onChange={(e) => setOnlineVisibility(e.target.value as VisibilityOption)}
                      className="border border-border rounded px-2 py-1 text-sm bg-background"
                    >
                      <option>Todos</option>
                      <option>Mis contactos</option>
                      <option>Nadie</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-2xl bg-card shadow-sm">
                    <div>
                      <p className="font-medium text-foreground">Quién puede ver tu foto de perfil</p>
                      <p className="text-sm text-muted-foreground">Tus contactos</p>
                    </div>
                    <select
                      value={photoVisibility}
                      onChange={(e) => setPhotoVisibility(e.target.value as VisibilityOption)}
                      className="border border-border rounded px-2 py-1 text-sm bg-background"
                    >
                      <option>Todos</option>
                      <option>Mis contactos</option>
                      <option>Nadie</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-2xl bg-card shadow-sm">
                    <div>
                      <p className="font-medium text-foreground">Quién puede ver tus estados</p>
                      <p className="text-sm text-muted-foreground">Tus contactos</p>
                    </div>
                    <select
                      value={statusVisibility}
                      onChange={(e) => setStatusVisibility(e.target.value as VisibilityOption)}
                      className="border border-border rounded px-2 py-1 text-sm bg-background"
                    >
                      <option>Todos</option>
                      <option>Mis contactos</option>
                      <option>Nadie</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-2xl bg-card shadow-sm">
                    <div>
                      <p className="font-medium text-foreground">Confirmar lectura (visto)</p>
                      <p className="text-sm text-muted-foreground">Permite que otros sepan si leíste un mensaje</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={confirmRead}
                      onChange={(e) => setConfirmRead(e.target.checked)}
                      className="w-4 h-4 accent-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Notificaciones</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border border-border rounded-2xl bg-card shadow-sm">
                    <div>
                      <p className="font-medium text-foreground">Notificaciones de mensajes</p>
                      <p className="text-sm text-muted-foreground">Recibe alertas de nuevos mensajes</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationsPush}
                      onChange={(e) => setNotificationsPush(e.target.checked)}
                      className="w-4 h-4 accent-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-2xl bg-card shadow-sm">
                    <div>
                      <p className="font-medium text-foreground">Sonido de notificación</p>
                      <p className="text-sm text-muted-foreground">Reproduce sonido para nuevos mensajes</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSound}
                      onChange={(e) => setNotificationSound(e.target.checked)}
                      className="w-4 h-4 accent-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-2xl bg-card shadow-sm">
                    <div>
                      <p className="font-medium text-foreground">Vibración</p>
                      <p className="text-sm text-muted-foreground">Vibra para nuevos mensajes</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={vibrationEnabled}
                      onChange={(e) => setVibrationEnabled(e.target.checked)}
                      className="w-4 h-4 accent-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'about' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Acerca de CUChatNet</h3>
                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-2xl bg-card shadow-sm">
                    <p className="text-sm text-muted-foreground mb-1">Versión</p>
                    <p className="font-semibold text-foreground">1.0.0 (Mockup)</p>
                  </div>

                  <div className="p-4 border border-border rounded-2xl bg-card shadow-sm">
                    <p className="text-sm text-muted-foreground mb-1">Institución</p>
                    <p className="font-semibold text-foreground">CUC - Universidad Central</p>
                  </div>

                  <div className="p-4 border border-border rounded-2xl bg-card shadow-sm">
                    <p className="text-sm text-muted-foreground mb-1">Descripción</p>
                    <p className="text-sm text-foreground">
                      CUChatNet es un sistema de mensajería seguro diseñado para estudiantes y administrativos universitarios con cifrado de extremo a extremo.
                    </p>
                  </div>

                  <Button variant="outline" className="w-full bg-transparent rounded-xl">
                    Ver Términos de Servicio
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent rounded-xl">
                    Ver Política de Privacidad
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}