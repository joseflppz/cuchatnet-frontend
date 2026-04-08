'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { apiPost } from '@/lib/api-client'

type Paso = 'correo' | 'codigo' | 'cambiar'

interface Props {
  onVolverAlLogin: () => void
}

export default function RecuperarContrasenaAdminScreen({ onVolverAlLogin }: Props) {
  const [paso, setPaso] = useState<Paso>('correo')
  const [correo, setCorreo] = useState('')
  const [codigo, setCodigo] = useState('')
  const [tokenRecuperacion, setTokenRecuperacion] = useState('')
  const [nuevaContrasena, setNuevaContrasena] = useState('')
  const [confirmarContrasena, setConfirmarContrasena] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const limpiarMensajes = () => {
    setMensaje('')
    setError('')
  }

  const enviarCodigo = async () => {
    limpiarMensajes()

    if (!correo.trim()) {
      setError('Debes ingresar el correo.')
      return
    }

    try {
      setCargando(true)

      const response = await apiPost<{ mensaje: string }>(
        '/api/admin/recuperacion-contrasena/enviar-codigo',
        { correo }
      )

      setMensaje(response.mensaje || 'Se envió el código al correo.')
      setPaso('codigo')
    } catch (e: any) {
      setError(e.message || 'No se pudo enviar el código.')
    } finally {
      setCargando(false)
    }
  }

  const verificarCodigo = async () => {
    limpiarMensajes()

    if (!correo.trim() || !codigo.trim()) {
      setError('Correo y código son requeridos.')
      return
    }

    try {
      setCargando(true)

      const response = await apiPost<{ mensaje: string; tokenRecuperacion: string }>(
        '/api/admin/recuperacion-contrasena/verificar-codigo',
        { correo, codigo }
      )

      setTokenRecuperacion(response.tokenRecuperacion)
      setMensaje(response.mensaje || 'Código verificado correctamente.')
      setPaso('cambiar')
    } catch (e: any) {
      setError(e.message || 'No se pudo verificar el código.')
    } finally {
      setCargando(false)
    }
  }

  const cambiarContrasena = async () => {
    limpiarMensajes()

    if (!nuevaContrasena || !confirmarContrasena) {
      setError('Debes completar ambas contraseñas.')
      return
    }

    try {
      setCargando(true)

      const response = await apiPost<{ mensaje: string }>(
        '/api/admin/recuperacion-contrasena/cambiar-contrasena',
        {
          tokenRecuperacion,
          nuevaContrasena,
          confirmarContrasena
        }
      )

      setMensaje(response.mensaje || 'Contraseña cambiada correctamente.')

      setTimeout(() => {
        onVolverAlLogin()
      }, 1200)
    } catch (e: any) {
      setError(e.message || 'No se pudo cambiar la contraseña.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-card border border-border rounded-2xl p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-foreground mb-2">Recuperar contraseña</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Sigue los pasos para recuperar el acceso al panel de administración.
      </p>

      {mensaje && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {paso === 'correo' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Correo</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="admin@correo.com"
              className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
            />
          </div>

          <Button onClick={enviarCodigo} disabled={cargando} className="w-full rounded-xl">
            {cargando ? 'Enviando...' : 'Enviar código'}
          </Button>

          <Button onClick={onVolverAlLogin} variant="outline" className="w-full rounded-xl">
            Volver al login
          </Button>
        </div>
      )}

      {paso === 'codigo' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Correo</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Código</label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="123456"
              className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
            />
          </div>

          <Button onClick={verificarCodigo} disabled={cargando} className="w-full rounded-xl">
            {cargando ? 'Verificando...' : 'Verificar código'}
          </Button>

          <Button onClick={() => setPaso('correo')} variant="outline" className="w-full rounded-xl">
            Volver
          </Button>
        </div>
      )}

      {paso === 'cambiar' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Nueva contraseña</label>
            <input
              type="password"
              value={nuevaContrasena}
              onChange={(e) => setNuevaContrasena(e.target.value)}
              placeholder="********"
              className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Confirmar contraseña</label>
            <input
              type="password"
              value={confirmarContrasena}
              onChange={(e) => setConfirmarContrasena(e.target.value)}
              placeholder="********"
              className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
            />
          </div>

          <Button onClick={cambiarContrasena} disabled={cargando} className="w-full rounded-xl">
            {cargando ? 'Guardando...' : 'Cambiar contraseña'}
          </Button>

          <Button onClick={() => setPaso('codigo')} variant="outline" className="w-full rounded-xl">
            Volver
          </Button>
        </div>
      )}
    </div>
  )
}