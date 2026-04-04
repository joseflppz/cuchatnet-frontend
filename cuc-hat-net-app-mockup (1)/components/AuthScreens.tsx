'use client'
'use client'

import React, { useState } from "react"
import { useApp } from '@/contexts/AppContext'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export function LoginScreen() {

  const { setCurrentView, showToast } = useApp()
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('+506')

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))
  }

  // 👇 AQUÍ va handleLogin (DENTRO del componente)
  const handleLogin = async () => {
    if (!phone || phone.length < 8) {
      showToast('Por favor ingresa un número válido', 'error')
      return
    }

    try {
  const fullPhone = `${country}${phone}`

  const response = await fetch('/api/verify/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: fullPhone }),
  })

  const data = await response.json()

  if (!response.ok) {
    showToast(data.error || 'Error enviando código', 'error')
    return
  }

  // ✅ AQUÍ VA
  localStorage.setItem('verify_phone', fullPhone)

  showToast('Código enviado correctamente', 'success')
  setCurrentView('verify-sms')

} catch (error) {
  showToast('Error de conexión', 'error')
}
}

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => setCurrentView('landing')}
          className="flex items-center gap-2 text-primary mb-8 hover:opacity-80"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="bg-white rounded-xl border border-border shadow-sm p-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">C</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-foreground mb-2">Bienvenido a CUChatNet</h1>
          <p className="text-center text-muted-foreground mb-8">Inicia sesión o crea una cuenta</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">País/Extensión</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="+506">🇨🇷 Costa Rica (+506)</option>
                <option value="+34">🇪🇸 España (+34)</option>
                <option value="+55">🇧🇷 Brasil (+55)</option>
                <option value="+52">🇲🇽 México (+52)</option>
                <option value="+1">🇺🇸 USA (+1)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Número de Teléfono</label>
              <div className="flex gap-2">
                <span className="flex items-center px-4 py-2 bg-muted text-muted-foreground border border-border rounded-lg">{country}</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="Ej: 87654321"
                  className="flex-1 border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Se enviará un código de verificación por SMS</p>
            </div>

            <Button onClick={handleLogin} className="w-full bg-primary hover:bg-primary/90 mt-6">
              Enviar Código
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function VerifySmsScreen() {
  const { setCurrentView, showToast } = useApp()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
  }

 const handleVerify = async () => {
  if (code.length !== 6) {
    showToast('Por favor ingresa un código de 6 dígitos', 'error')
    return
  }

  try {
    setLoading(true)

    const phone = localStorage.getItem('verify_phone')

    const response = await fetch('/api/verify/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    })

    const data = await response.json()

    if (!response.ok) {
      showToast(data.error || 'Código incorrecto', 'error')
      setLoading(false)
      return
    }

    showToast('SMS verificado correctamente', 'success')
    setLoading(false)
    setCurrentView('profile-setup')

  } catch (error) {
    showToast('Error verificando código', 'error')
    setLoading(false)
  }
}



  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => setCurrentView('login')}
          className="flex items-center gap-2 text-primary mb-8 hover:opacity-80"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="bg-white rounded-xl border border-border shadow-sm p-8">
          <div className="text-center mb-6">
            <div className="inline-block w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
              <span className="text-2xl">📱</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Verifica tu teléfono</h1>
            <p className="text-muted-foreground">Hemos enviado un código de 6 dígitos a tu número</p>
          </div>

          {loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-center">
              <p className="text-sm text-blue-700">Verificando código...</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Código de Verificación</label>
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder="000000"
                maxLength={6}
                className="w-full text-center text-2xl font-mono border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent tracking-widest"
              />
            </div>

            <Button onClick={handleVerify} disabled={loading} className="w-full bg-primary hover:bg-primary/90">
              {loading ? 'Verificando...' : 'Verificar'}
            </Button>

            <button className="w-full text-sm text-primary hover:text-primary/80 font-medium">Reenviar código (30s)</button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          💡 Se envió un codigo a tu númmero <span className="font-semibold">Introduce aqui</span> para verificar tu cuenta
        </p>
      </div>
    </div>
  )
}

export function ProfileSetupScreen() {
  const { setCurrentView, setCurrentUser, showToast, setChats, setGroups, setContacts, setStates } = useApp()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<string | undefined>(undefined)

  const [loading, setLoading] = useState(false)

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setPhoto(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setPhoto(undefined)

  }

  const handleSetup = () => {
    if (!name.trim()) {
      showToast('Por favor ingresa tu nombre', 'error')
      return
    }

    setLoading(true)

    setTimeout(() => {
        const user = {
          id: 'user-' + Date.now(),
          phone: '+506 8765 4321',
          name,
          photo,
          description,
          status: 'available' as const,
          createdAt: new Date().toISOString(),
          active: true,
        }


      setCurrentUser(user)

      // Initialize mock data
      setChats([
        { id: '1', participantId: 'p1', participantName: 'Ana García', participantPhoto: '👩', lastMessage: 'Perfecto, nos vemos luego', lastMessageTime: '14:32', unread: 0, pinned: false, archived: false, isGroup: false, silenced: false },
        { id: '2', participantId: 'p2', participantName: 'Carlos López', participantPhoto: '👨', lastMessage: 'Enviado el documento', lastMessageTime: '12:15', unread: 2, pinned: true, archived: false, isGroup: false, silenced: false },
        { id: '3', participantId: 'p3', participantName: 'María Rodríguez', participantPhoto: '👩', lastMessage: 'Gracias por la ayuda', lastMessageTime: 'ayer', unread: 0, pinned: false, archived: false, isGroup: false, silenced: false },
        { id: '4', participantId: 'p4', participantName: 'Juan Martínez', participantPhoto: '👨', lastMessage: 'Mañana a las 10am?', lastMessageTime: 'ayer', unread: 0, pinned: false, archived: false, isGroup: false, silenced: false },
        { id: '5', participantId: 'p5', participantName: 'Sofia Pérez', participantPhoto: '👩', lastMessage: 'Listo! 👍', lastMessageTime: 'lun', unread: 0, pinned: false, archived: false, isGroup: false, silenced: false },
      ])

      setGroups([
        { id: 'g1', name: 'Equipo Proyecto', photo: '👥', description: 'Grupo de trabajo del proyecto final', rules: 'Respetar a todos', members: [{ id: 'user-1', name: 'Tú', role: 'admin' }, { id: 'p1', name: 'Ana', role: 'member' }, { id: 'p2', name: 'Carlos', role: 'member' }], createdAt: '2026-01-15', creatorId: 'user-1', permissions: { sendMessages: 'all', editInfo: 'admins' } },
        { id: 'g2', name: 'Curso Ingeniería', photo: '📚', description: 'Grupo del curso de Ingeniería de Software', rules: 'Preguntas académicas', members: [{ id: 'user-1', name: 'Tú', role: 'member' }, { id: 'p3', name: 'María', role: 'admin' }], createdAt: '2026-01-20', creatorId: 'p3', permissions: { sendMessages: 'all', editInfo: 'admins' } },
      ])

      setContacts([
        { id: 'p1', name: 'Ana García', phone: '+506 8765 1234', photo: '👩', description: 'Compañera de clase', status: 'available', fromAgenda: true },
        { id: 'p2', name: 'Carlos López', phone: '+506 8765 5678', photo: '👨', status: 'available', fromAgenda: true },
        { id: 'p3', name: 'María Rodríguez', phone: '+506 8765 9012', photo: '👩', status: 'available', fromAgenda: true },
        { id: 'p4', name: 'Juan Martínez', phone: '+506 8765 3456', photo: '👨', status: 'away', fromAgenda: false },
        { id: 'p5', name: 'Sofia Pérez', phone: '+506 8765 7890', photo: '👩', status: 'available', fromAgenda: true },
      ])

      setStates([
        { id: 's1', userId: 'p1', userName: 'Ana García', userPhoto: '👩', content: 'Disfrutando del campus', type: 'text', createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 24*60*60*1000).toISOString(), viewedBy: ['user-1'] },
        { id: 's2', userId: 'p2', userName: 'Carlos López', userPhoto: '👨', content: 'En la biblioteca', type: 'text', createdAt: new Date(Date.now() - 2*60*60*1000).toISOString(), expiresAt: new Date(Date.now() - 2*60*60*1000 + 24*60*60*1000).toISOString(), viewedBy: [] },
      ])

      setLoading(false)
      // Persist user to localStorage
      localStorage.setItem('cuchatnet_currentUser', JSON.stringify(user))
      showToast('Cuenta creada con éxito', 'success')
      setTimeout(() => setCurrentView('chat'), 500)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <button
          onClick={() => setCurrentView('login')}
          className="flex items-center gap-2 text-primary mb-8 hover:opacity-80"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="bg-white rounded-xl border border-border shadow-sm p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">Crea tu perfil</h1>
            <p className="text-muted-foreground text-sm">Completa la información de tu cuenta</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">Foto de Perfil (opcional)</label>
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-dashed border-border">
                  {photo ? (
                    <img src={photo} alt="profile" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-3xl">📷</span>
                  )}
                </div>
                <div className="flex gap-2 w-full">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <div className="bg-muted hover:bg-muted/80 text-muted-foreground text-sm py-2 px-3 rounded-lg text-center cursor-pointer transition">
                      Seleccionar imagen
                    </div>
                  </label>
                  {photo && (
                    <button
                      onClick={handleRemovePhoto}
                      className="bg-secondary/10 hover:bg-secondary/20 text-secondary text-sm py-2 px-3 rounded-lg transition"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Nombre *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre completo"
                maxLength={50}
                className="w-full border border-border rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Descripción (opcional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Estudiante de Ingeniería"
                maxLength={100}
                rows={3}
                className="w-full border border-border rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">{description.length}/100</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-blue-900">
                <strong>Privacidad:</strong> Tu perfil será visible solo para tus contactos y en grupos donde participes.
              </p>
            </div>

            <Button onClick={handleSetup} disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              {loading ? 'Creando cuenta...' : 'Completar Perfil'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminLoginScreen() {
  const { setCurrentView, setIsAdmin, showToast } = useApp()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = () => {
    if (!username || !password) {
      showToast('Por favor completa todos los campos', 'error')
      return
    }

    if (username === 'admin' && password === 'admin123') {
      setIsAdmin(true)
      showToast('Sesión administrativa iniciada', 'success')
      setTimeout(() => setCurrentView('admin-dashboard'), 500)
    } else {
      showToast('Credenciales incorrectas', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => setCurrentView('landing')}
          className="flex items-center gap-2 text-primary mb-8 hover:opacity-80"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="bg-white rounded-xl border border-border shadow-sm p-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">⚙️</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-foreground mb-2">Acceso Administrativo</h1>
          <p className="text-center text-muted-foreground mb-8">Ingresa con tus credenciales</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="nombre de usuario"
                className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <Button onClick={handleLogin} className="w-full bg-primary hover:bg-primary/90">
              Iniciar Sesión
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              💡 Usuario: <span className="font-semibold">admin</span> | Contraseña: <span className="font-semibold">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
