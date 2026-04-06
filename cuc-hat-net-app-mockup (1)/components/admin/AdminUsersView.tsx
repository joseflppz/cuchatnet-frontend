'use client'

import { Search, Trash2, Lock, Unlock, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

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

interface User {
  id: number
  phone: string
  name: string
  status: string
  createdAt: string
  lastActive: string | null
  email: string | null
}

interface CreateUserForm {
  name: string
  countryCode: string
  phoneNumber: string
  email: string
  status: string
}

function CreateUserModal({ open, onClose, onSaved }: {
  open: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<CreateUserForm>({
    name: '',
    countryCode: '+506',
    phoneNumber: '',
    email: '',
    status: 'active',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm({ name: '', countryCode: '+506', phoneNumber: '', email: '', status: 'active' })
      setError(null)
    }
  }, [open])

  const handleSave = async () => {
    if (!form.name.trim() || !form.phoneNumber.trim()) {
      setError('Nombre y teléfono son obligatorios.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await apiFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          countryCode: form.countryCode,
          phoneNumber: form.phoneNumber.trim(),
          email: form.email.trim() || null,
          status: form.status,
        }),
      })
      onSaved()
      onClose()
    } catch {
      setError('Error al crear usuario. Verifica que el teléfono no esté duplicado.')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full border border-border overflow-hidden">
        <div className="border-b border-border p-4 flex items-center justify-between">
          <h2 className="font-bold text-lg text-foreground">Nuevo Usuario</h2>
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
            <label className="block text-sm font-medium text-foreground mb-1">Nombre completo *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: Juan Pérez"
              className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Teléfono *</label>
            <div className="flex gap-2">
              <select
                value={form.countryCode}
                onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
                className="border border-border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-primary"
              >
                <option value="+506">🇨🇷 +506</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+34">🇪🇸 +34</option>
                <option value="+52">🇲🇽 +52</option>
                <option value="+55">🇧🇷 +55</option>
              </select>
              <input
                type="text"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 15) })}
                placeholder="88881234"
                className="flex-1 border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="usuario@ejemplo.com"
              className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Estado</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full border border-border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-primary"
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="suspended">Bloqueado</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {saving ? 'Guardando...' : 'Crear Usuario'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsersView() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const fetchUsers = (p = 1, s = '') => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), pageSize: '20' })
    if (s) params.append('search', s)
    apiFetch<any>(`/api/admin/users?${params}`)
      .then(res => {
        if (Array.isArray(res)) {
          setUsers(res)
          setTotal(res.length)
          setTotalPages(1)
          setPage(1)
        } else {
          setUsers(res.data ?? [])
          setTotal(res.total ?? 0)
          setTotalPages(res.totalPages ?? 1)
          setPage(res.page ?? 1)
        }
      })
      .catch(() => setError('Error al cargar usuarios'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const handleSearch = () => {
    setSearch(searchInput)
    fetchUsers(1, searchInput)
  }

  const handleDelete = async (userId: number, name: string) => {
    if (!window.confirm(`¿Eliminar al usuario "${name}"?`)) return
    try {
      await apiFetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      fetchUsers(page, search)
    } catch {
      alert('Error al eliminar usuario')
    }
  }

  const handleBlock = async (userId: number, name: string) => {
    if (!window.confirm(`¿Bloquear al usuario "${name}" por 60 minutos?`)) return
    try {
      await apiFetch(`/api/admin/users/${userId}/block`, {
        method: 'PUT',
        body: JSON.stringify({ duracionMinutos: 60, motivo: 'Bloqueado desde panel admin' }),
      })
      fetchUsers(page, search)
    } catch {
      alert('Error al bloquear usuario')
    }
  }

  const handleUnblock = async (userId: number) => {
    try {
      await apiFetch(`/api/admin/users/${userId}/unblock`, { method: 'PUT' })
      fetchUsers(page, search)
    } catch {
      alert('Error al desbloquear usuario')
    }
  }

  const statusLabel: Record<string, { label: string; className: string }> = {
    active: { label: 'Activo', className: 'bg-green-100 text-green-700' },
    inactive: { label: 'Inactivo', className: 'bg-gray-100 text-gray-600' },
    suspended: { label: 'Bloqueado', className: 'bg-red-100 text-red-700' },
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-2 flex-1 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Buscar por nombre, email o teléfono..."
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button onClick={handleSearch} className="bg-primary hover:bg-primary/90">
            Buscar
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">{total} usuarios en total</p>
          <Button onClick={() => setShowCreate(true)} className="bg-primary hover:bg-primary/90">
            + Nuevo Usuario
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-muted-foreground">Cargando usuarios...</p>
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
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Nombre</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Email</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Teléfono</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Registro</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Último acceso</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Estado</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const st = statusLabel[user.status] ?? { label: user.status, className: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={user.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-3 font-medium text-foreground">{user.name}</td>
                      <td className="px-6 py-3 text-muted-foreground">{user.email ?? '—'}</td>
                      <td className="px-6 py-3 text-muted-foreground">{user.phone}</td>
                      <td className="px-6 py-3 text-muted-foreground text-xs">
                        {new Date(user.createdAt).toLocaleDateString('es-CR')}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground text-xs">
                        {user.lastActive ? new Date(user.lastActive).toLocaleDateString('es-CR') : '—'}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${st.className}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2">
                          {user.status === 'suspended' ? (
                            <button onClick={() => handleUnblock(user.id)} className="p-1 hover:bg-green-100 rounded" title="Desbloquear">
                              <Unlock className="w-4 h-4 text-green-600" />
                            </button>
                          ) : (
                            <button onClick={() => handleBlock(user.id, user.name)} className="p-1 hover:bg-yellow-100 rounded" title="Bloquear">
                              <Lock className="w-4 h-4 text-yellow-600" />
                            </button>
                          )}
                          <button onClick={() => handleDelete(user.id, user.name)} className="p-1 hover:bg-red-100 rounded" title="Eliminar">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {users.length === 0 && (
                  <tr>
                    <td className="px-6 py-6 text-sm text-muted-foreground" colSpan={7}>
                      No hay usuarios.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Página {page} de {totalPages}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => fetchUsers(page - 1, search)}>
            Anterior
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => fetchUsers(page + 1, search)}>
            Siguiente
          </Button>
        </div>
      </div>

      <CreateUserModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSaved={() => fetchUsers(1, search)}
      />
    </div>
  )
}