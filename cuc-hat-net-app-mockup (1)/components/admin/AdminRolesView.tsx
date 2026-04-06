'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, X, Plus } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7086"

function getToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("admin_token")
}

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

interface Rol {
  id: number
  codigo: string
  nombre: string
  activo: boolean
  fechaCreacion: string
  totalUsuarios: number
}

interface RolForm {
  codigo: string
  nombre: string
  activo: boolean
}

function RolModal({ open, title, initial, onClose, onSave }: {
  open: boolean
  title: string
  initial: RolForm
  onClose: () => void
  onSave: (data: RolForm) => Promise<void>
}) {
  const [form, setForm] = useState<RolForm>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(initial)
      setError(null)
    }
  }, [open, initial])

  const handleSave = async () => {
    if (!form.codigo.trim() || !form.nombre.trim()) {
      setError('Código y nombre son obligatorios.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(form)
      onClose()
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar rol.')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full border border-border overflow-hidden">
        <div className="border-b border-border p-4 flex items-center justify-between">
          <h2 className="font-bold text-lg text-foreground">{title}</h2>
          <button onClick={onClose} className="text-foreground/60 hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Código *</label>
            <input
              type="text"
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value.toLowerCase().replace(/\s/g, '_') })}
              placeholder="Ej: moderador"
              className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">Solo letras minúsculas y guiones bajos</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Nombre *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Moderador"
              className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-foreground">Rol activo</span>
            </label>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminRolesView() {
  const [roles, setRoles] = useState<Rol[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editRol, setEditRol] = useState<Rol | null>(null)

  const fetchRoles = () => {
    setLoading(true)
    apiFetch<Rol[]>('/api/admin/roles')
      .then(setRoles)
      .catch(() => setError('Error al cargar roles'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchRoles() }, [])

  const handleCreate = async (data: RolForm) => {
    await apiFetch('/api/admin/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    fetchRoles()
  }

  const handleEdit = async (data: RolForm) => {
    if (!editRol) return
    await apiFetch(`/api/admin/roles/${editRol.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    fetchRoles()
  }

  const handleDelete = async (rol: Rol) => {
    if (rol.totalUsuarios > 0) {
      alert(`No se puede eliminar "${rol.nombre}" porque tiene ${rol.totalUsuarios} usuario(s) asignado(s).`)
      return
    }
    if (!window.confirm(`¿Eliminar el rol "${rol.nombre}"?`)) return
    try {
      await apiFetch(`/api/admin/roles/${rol.id}`, { method: 'DELETE' })
      fetchRoles()
    } catch {
      alert('Error al eliminar rol')
    }
  }

  const createInitial: RolForm = { codigo: '', nombre: '', activo: true }
  const editInitial: RolForm = editRol
    ? { codigo: editRol.codigo, nombre: editRol.nombre, activo: editRol.activo }
    : createInitial

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{roles.length} roles en total</p>
        <Button onClick={() => setShowCreate(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Rol
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">Cargando roles...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <Card className="border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Código</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Nombre</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Usuarios</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Creado</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Estado</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((rol) => (
                  <tr key={rol.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3 font-mono text-sm text-foreground">{rol.codigo}</td>
                    <td className="px-6 py-3 font-medium text-foreground">{rol.nombre}</td>
                    <td className="px-6 py-3 text-muted-foreground">{rol.totalUsuarios}</td>
                    <td className="px-6 py-3 text-muted-foreground text-xs">
                      {new Date(rol.fechaCreacion).toLocaleDateString('es-CR')}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rol.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {rol.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditRol(rol)}
                          className="p-1 hover:bg-muted rounded"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(rol)}
                          className="p-1 hover:bg-red-100 rounded"
                          title="Eliminar"
                          disabled={rol.totalUsuarios > 0}
                        >
                          <Trash2 className={`w-4 h-4 ${rol.totalUsuarios > 0 ? 'text-gray-300' : 'text-red-600'}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {roles.length === 0 && (
                  <tr>
                    <td className="px-6 py-6 text-sm text-muted-foreground" colSpan={6}>
                      No hay roles.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <RolModal
        open={showCreate}
        title="Nuevo Rol"
        initial={createInitial}
        onClose={() => setShowCreate(false)}
        onSave={handleCreate}
      />

      <RolModal
        open={!!editRol}
        title="Editar Rol"
        initial={editInitial}
        onClose={() => setEditRol(null)}
        onSave={handleEdit}
      />
    </div>
  )
}