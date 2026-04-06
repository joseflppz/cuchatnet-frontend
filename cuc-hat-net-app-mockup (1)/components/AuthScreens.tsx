'use client'

import React, { useState } from "react"
import { useApp } from '@/contexts/AppContext'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { sendCode, verifyCode } from "@/lib/authService";
import { getUser } from "@/lib/userService";

// --- PANTALLA DE LOGIN ---
export function LoginScreen() {
  const { setCurrentView, showToast } = useApp()
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('+506')
  const [loading, setLoading] = useState(false)

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))
  }

  const handleLogin = async () => {
    if (!phone || phone.length < 8) {
      showToast('Por favor ingresa un número válido', 'error')
      return
    }

    try {
      setLoading(true)
      const fullPhone = `${country}${phone}`
      await sendCode(fullPhone)
      
      localStorage.setItem('verify_phone', fullPhone)
      showToast('Código enviado correctamente', 'success')
      setCurrentView('verify-sms')
    } catch (error) {
      showToast('Error enviando código', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <button onClick={() => setCurrentView('landing')} className="flex items-center gap-2 text-primary mb-8 hover:opacity-80">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <div className="bg-white rounded-xl border border-border shadow-sm p-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl">C</div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">Bienvenido a CUChatNet</h1>
          <p className="text-center text-muted-foreground mb-8">Inicia sesión con tu teléfono</p>

          <div className="space-y-4">
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full border rounded-lg px-4 py-2">
              <option value="+506">🇨🇷 Costa Rica (+506)</option>
              <option value="+34">🇪🇸 España (+34)</option>
              <option value="+1">🇺🇸 USA (+1)</option>
            </select>
            <div className="flex gap-2">
              <span className="flex items-center px-4 bg-muted border rounded-lg">{country}</span>
              <input type="tel" value={phone} onChange={handlePhoneChange} placeholder="87654321" className="flex-1 border rounded-lg px-4 py-2" />
            </div>
            <Button onClick={handleLogin} disabled={loading} className="w-full">
              {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : 'Enviar Código'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- PANTALLA DE VERIFICACIÓN ---
export function VerifySmsScreen() {
  const { setCurrentView, showToast, setCurrentUser, setChats } = useApp()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleVerify = async () => {
    if (code.length !== 6) {
      showToast('Ingresa los 6 dígitos', 'error')
      return
    }

    try {
      setLoading(true)
      const phone = localStorage.getItem('verify_phone')
      const data = await verifyCode(phone!, code)

      // Identificar el ID que viene del backend
      const rawId = data?.userId || data?.id || data?.usuarioId || data?.idUsuario;
      
      if (!rawId || rawId === "undefined") {
        throw new Error("ID de usuario no válido recibido del servidor");
      }

      const user = await getUser(rawId)

      // ✅ NORMALIZACIÓN CRÍTICA: Forzamos que el objeto tenga .id
      const normalizedUser = {
        ...user,
        id: (user.id || user.usuarioId || user.idUsuario || rawId).toString()
      };

      // 1. Limpiar rastro anterior
      setChats([]) 
      
      // 2. Sincronizar Contexto y Storage con el usuario normalizado
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      setCurrentUser(normalizedUser); 

      showToast('Sesión iniciada', 'success')

      if (!normalizedUser.nombre || normalizedUser.nombre.trim() === "") {
        setCurrentView('profile-setup')
      } else {
        setCurrentView('chat')
      }
    } catch (error: any) {
      console.error("Error en verificación:", error)
      showToast('Código incorrecto o error de servidor', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <button onClick={() => setCurrentView('login')} className="flex items-center gap-2 text-primary mb-8">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Verifica tu teléfono</h1>
          <p className="text-sm text-muted-foreground mb-6">Introduce el código enviado por SMS</p>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full text-center text-3xl tracking-[0.5em] font-mono border rounded-lg p-3 mb-6 focus:ring-2 focus:ring-primary outline-none"
            placeholder="000000"
          />
          <Button onClick={handleVerify} disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : 'Verificar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// --- PANTALLA DE PERFIL ---
export function ProfileSetupScreen() {
  const { setCurrentView, setCurrentUser, showToast, setChats } = useApp()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(false)

  const handleSetup = async () => {
    if (!name.trim()) {
      showToast('El nombre es obligatorio', 'error')
      return
    }

    try {
      setLoading(true)
      const phone = localStorage.getItem('verify_phone')

      const response = await fetch('https://localhost:7086/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: name, 
          telefono: phone || "",
          descripcion: description,
          foto: photo || "",
          estado: "disponible"
        })
      })

      if (!response.ok) throw new Error("Error en la creación");

      const newUser = await response.json()

      // ✅ NORMALIZACIÓN TRAS CREACIÓN:
      const normalizedNewUser = {
        ...newUser,
        id: (newUser.id || newUser.usuarioId || newUser.idUsuario).toString()
      };

      setChats([])
      localStorage.setItem('user', JSON.stringify(normalizedNewUser))
      setCurrentUser(normalizedNewUser)

      showToast('Perfil creado correctamente', 'success')
      setCurrentView('chat')
    } catch (error) {
      showToast('Error al conectar con el servidor', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-xl border p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-6">Crea tu perfil</h1>
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-2">
             <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed flex items-center justify-center overflow-hidden">
               {photo ? <img src={photo} className="w-full h-full object-cover" alt="Preview" /> : <span className="text-3xl">📷</span>}
             </div>
             <input type="file" accept="image/*" onChange={(e) => {
               const file = e.target.files?.[0];
               if(file) {
                 const reader = new FileReader();
                 reader.onload = (ev) => setPhoto(ev.target?.result as string);
                 reader.readAsDataURL(file);
               }
             }} className="text-xs text-muted-foreground file:mr-4 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-primary/10 file:text-primary" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Nombre completo *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Juan Pérez" className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Descripción (opcional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Cuéntanos algo sobre ti..." className="w-full border rounded-lg px-4 py-2 h-24 resize-none focus:ring-2 focus:ring-primary outline-none" />
          </div>
          <Button onClick={handleSetup} disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : 'Completar Perfil'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// --- ADMIN LOGIN ---
export function AdminLoginScreen() {
  const { setCurrentView, setIsAdmin, showToast } = useApp()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = () => {
    if (username === 'admin' && password === 'admin123') {
      setIsAdmin(true)
      showToast('Acceso Administrativo', 'success')
      setCurrentView('admin-dashboard')
    } else {
      showToast('Credenciales incorrectas', 'error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-xl border shadow-sm">
        <h2 className="text-xl font-bold text-center mb-6">Panel de Control</h2>
        <div className="space-y-4">
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Usuario" className="w-full border rounded-lg px-4 py-2" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" className="w-full border rounded-lg px-4 py-2" />
          <Button onClick={handleLogin} className="w-full">Entrar</Button>
        </div>
      </div>
    </div>
  )
}