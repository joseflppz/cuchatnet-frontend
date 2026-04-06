'use client'

import React, { useState } from "react"
import { useApp } from '@/contexts/AppContext'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { apiPost } from '@/lib/api-client'
import { loadClientData, mapAuthUser } from '@/lib/api/bootstrap'

export function LoginScreen() {
  const { setCurrentView, showToast } = useApp()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value.trim().toLowerCase())
  }

  const handleLogin = async () => {
    if (!email || !email.includes('@')) {
      showToast('Por favor ingresa un correo válido', 'error')
      return
    }

    try {
      setLoading(true)

      await apiPost('/api/verify/send', { email })

      localStorage.setItem('verify_email', email)

      showToast('Código enviado correctamente al correo', 'success')
      setTimeout(() => setCurrentView('verify-sms'), 300)
    } catch (error: any) {
      showToast(error.message || 'Error enviando código', 'error')
    } finally {
      setLoading(false)
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
              <label className="block text-sm font-medium text-foreground mb-2">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Ej: usuario@gmail.com"
                className="w-full border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Se enviará un código de verificación a tu correo electrónico
              </p>
            </div>

            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 mt-6"
            >
              {loading ? 'Enviando código...' : 'Enviar Código'}
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
  const { setCurrentView, showToast, setCurrentUser, setChats, setGroups, setContacts, setStates } = useApp()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const email = localStorage.getItem('verify_email') || ''

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

      const savedEmail = localStorage.getItem('verify_email')
      if (!savedEmail) {
        showToast('No se encontró el correo a verificar', 'error')
        return
      }

      const data = await apiPost<any>('/api/verify/check', { email: savedEmail, code })

      if (data?.userExists && data?.user) {
        const mappedUser = mapAuthUser(data.user)
        const clientData = await loadClientData(mappedUser.id)

        setCurrentUser(mappedUser)
        setChats(clientData.chats)
        setGroups(clientData.groups)
        setContacts(clientData.contacts)
        setStates(clientData.states)

        localStorage.setItem('cuchatnet_currentUser', JSON.stringify(mappedUser))
        localStorage.setItem('cuchatnet_state', JSON.stringify(clientData))

        showToast('Correo verificado correctamente', 'success')
        setTimeout(() => setCurrentView('chat'), 300)
        return
      }

      showToast('Código verificado correctamente', 'success')
      setTimeout(() => setCurrentView('profile-setup'), 300)
    } catch (error: any) {
      showToast(error.message || 'Error verificando código', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      if (!email) {
        showToast('No se encontró el correo para reenviar el código', 'error')
        return
      }

      setResending(true)
      await apiPost('/api/verify/send', { email })
      showToast('Código reenviado correctamente', 'success')
    } catch (error: any) {
      showToast(error.message || 'Error reenviando código', 'error')
    } finally {
      setResending(false)
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
              <span className="text-2xl">📧</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Verifica tu correo</h1>
            <p className="text-muted-foreground">Hemos enviado un código de 6 dígitos a tu correo</p>
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

            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full text-sm text-primary hover:text-primary/80 font-medium disabled:opacity-60"
            >
              {resending ? 'Reenviando...' : 'Reenviar código'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 break-all">
          💡 Se envió un código al correo <span className="font-semibold">{email || 'Introduce aquí'}</span> para verificar tu cuenta
        </p>
      </div>
    </div>
  )
}

export function ProfileSetupScreen() {
  const { setCurrentView, setCurrentUser, showToast, setChats, setGroups, setContacts, setStates } = useApp()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)

  const email = localStorage.getItem('verify_email') || ''

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))
  }

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

  const handleSetup = async () => {
    if (!name.trim()) {
      showToast('Por favor ingresa tu nombre', 'error')
      return
    }

    if (!email) {
      showToast('No se encontró el correo a configurar', 'error')
      return
    }

    if (!phone || phone.length < 8) {
      showToast('Por favor ingresa un número de teléfono válido', 'error')
      return
    }

    try {
      setLoading(true)

      const user = await apiPost<any>('/api/auth/profile-setup', {
        email,
        name: name.trim(),
        phone,
        description: description || null,
        photoUrl: photo || null,
        status: 'available',
      })

      const mappedUser = mapAuthUser(user)
      const clientData = await loadClientData(mappedUser.id)

      setCurrentUser(mappedUser)
      setChats(clientData.chats)
      setGroups(clientData.groups)
      setContacts(clientData.contacts)
      setStates(clientData.states)

      localStorage.setItem('cuchatnet_currentUser', JSON.stringify(mappedUser))
      localStorage.setItem('cuchatnet_state', JSON.stringify(clientData))

      showToast('Cuenta creada con éxito', 'success')
      setTimeout(() => setCurrentView('chat'), 500)
    } catch (error: any) {
      showToast(error.message || 'No se pudo completar el perfil', 'error')
    } finally {
      setLoading(false)
    }
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
              <label className="block text-sm font-medium text-foreground mb-2">Correo</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full border border-border rounded-lg px-4 py-2 bg-muted text-muted-foreground"
              />
            </div>

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
              <label className="block text-sm font-medium text-foreground mb-2">Número de teléfono *</label>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="Ej: 61184904"
                maxLength={8}
                className="w-full border border-border rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-muted-foreground mt-1">Se guardará como parte de tu perfil</p>
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

  const handleLogin = async () => {
    if (!username || !password) {
      showToast('Por favor completa todos los campos', 'error')
      return
    }

    try {
      await apiPost('/api/auth/admin-login', { email: username, password })
      setIsAdmin(true)
      showToast('Sesión administrativa iniciada', 'success')
      setTimeout(() => setCurrentView('admin-dashboard'), 500)
    } catch (error: any) {
      showToast(error.message || 'Credenciales incorrectas', 'error')
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
              <label className="block text-sm font-medium text-foreground mb-2">Correo</label>
              <input
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin@correo.com"
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
          </div>
        </div>
      </div>
    </div>
  )
}