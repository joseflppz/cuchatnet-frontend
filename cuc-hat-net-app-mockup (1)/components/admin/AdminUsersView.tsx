'use client'

import { Search, Edit, Trash2, Eye, Check, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEffect, useMemo, useState } from 'react'
import { useApp } from '@/contexts/AppContext'

type AdminStatus = 'active' | 'inactive'

type UserMeta = {
  email: string
  status: AdminStatus
  joined: string
  lastActive: string
}

const META_KEY = 'cuchatnet_admin_users_meta_v1'

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function randomJoined2026() {
  const day = String(Math.floor(Math.random() * 25) + 1).padStart(2, '0')
  return `2026-01-${day}`
}

function randomLastActive() {
  return Math.random() > 0.5 ? '2 min' : '1 hora'
}

function phoneToEmail(phone: string) {
  return phone.replace(/\s/g, '') + '@cuc.edu'
}

/** Modal simple para Crear/Editar */
function UserFormModal({
  open,
  title,
  initial,
  onClose,
  onSave,
}: {
  open: boolean
  title: string
  initial: {
    name: string
    phone: string
    email: string
    status: AdminStatus
    joined: string
  }
  onClose: () => void
  onSave: (data: typeof initial) => void
}) {
  const [form, setForm] = useState(initial)

  useEffect(() => {
    setForm(initial)
  }, [initial])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full overflow-hidden border border-border">
        <div className="border-b border-border p-4 flex items-center justify-between">
          <h2 className="font-bold text-lg text-foreground">{title}</h2>
          <button onClick={onClose} className="text-foreground/60 hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Nombre</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
              placeholder="Nombre completo"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Teléfono</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
              placeholder="8888 8888"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Email</label>
            <input
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
              placeholder="usuario@cuc.edu"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Estado</label>
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as AdminStatus }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-white focus:ring-2 focus:ring-primary"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Fecha de ingreso</label>
              <input
                type="date"
                value={form.joined}
                onChange={(e) => setForm((p) => ({ ...p, joined: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-white focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={() => onSave(form)}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!form.name.trim() || !form.phone.trim() || !form.email.trim()}
            >
              Guardar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsersView() {
  const { contacts, setContacts, showToast } = useApp()

  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const [meta, setMeta] = useState<Record<string, UserMeta>>({})
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  // 1) Cargar meta (persistente)
  useEffect(() => {
    const saved = safeParse<Record<string, UserMeta>>(localStorage.getItem(META_KEY), {})
    setMeta(saved)
  }, [])

  // 2) Asegurar meta para todos los contactos + limpiar meta de eliminados (y hacerlo “estable”)
  useEffect(() => {
    setMeta((prev) => {
      let changed = false
      const next = { ...prev }

      // agregar meta a contactos nuevos
      for (const c of contacts) {
        if (!next[c.id]) {
          changed = true
          next[c.id] = {
            email: phoneToEmail(c.phone),
            status: Math.random() > 0.3 ? 'active' : 'inactive',
            joined: randomJoined2026(),
            lastActive: randomLastActive(),
          }
        }
      }

      // eliminar meta huérfana
      for (const id of Object.keys(next)) {
        if (!contacts.some((c) => c.id === id)) {
          changed = true
          delete next[id]
        }
      }

      return changed ? next : prev
    })
  }, [contacts])

  // 3) Guardar meta (persistente)
  useEffect(() => {
    localStorage.setItem(META_KEY, JSON.stringify(meta))
  }, [meta])

  const users = useMemo(() => {
    return contacts.map((c) => {
      const m = meta[c.id]
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: m?.email ?? phoneToEmail(c.phone),
        status: m?.status ?? 'active',
        joined: m?.joined ?? '2026-01-01',
        lastActive: m?.lastActive ?? '—',
      }
    })
  }, [contacts, meta])

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || user.status === filter
    return matchesSearch && matchesFilter
  })

  const selectedUser = users.find((u) => u.id === selectedUserId) || null

  const handleDeleteUser = (userId: string) => {
    const ok = window.confirm('¿Eliminar este usuario? (Simulado)')
    if (!ok) return

    setContacts(contacts.filter((c) => c.id !== userId))
    setMeta((prev) => {
      const next = { ...prev }
      delete next[userId]
      return next
    })
    showToast('Usuario eliminado', 'success')
    if (selectedUserId === userId) setSelectedUserId(null)
  }

  const openEdit = (id: string) => setEditId(id)

  const createInitial = {
    name: '',
    phone: '',
    email: '',
    status: 'active' as AdminStatus,
    joined: '2026-01-01',
  }

  const editInitial = useMemo(() => {
    const u = users.find((x) => x.id === editId)
    return u
      ? {
        name: u.name,
        phone: u.phone,
        email: u.email,
        status: u.status as AdminStatus,
        joined: u.joined,
      }
      : createInitial
  }, [editId, users])

  const handleCreate = (data: typeof createInitial) => {
    const nowId = `contact-${Date.now()}`
    const newContact = {
      id: nowId,
      name: data.name.trim(),
      phone: data.phone.trim(),
      // lo mínimo para que el resto del mockup no se rompa:
      photo: data.name.trim().charAt(0).toUpperCase(),
      status: 'available',
    } as any

    setContacts([...contacts, newContact])
    setMeta((prev) => ({
      ...prev,
      [nowId]: {
        email: data.email.trim(),
        status: data.status,
        joined: data.joined,
        lastActive: 'Ahora',
      },
    }))
    showToast('Usuario creado', 'success')
    setShowCreate(false)
  }

  const handleEdit = (data: typeof createInitial) => {
    if (!editId) return

    setContacts(
      contacts.map((c) =>
        c.id === editId
          ? ({
            ...c,
            name: data.name.trim(),
            phone: data.phone.trim(),
          } as any)
          : c
      )
    )

    setMeta((prev) => ({
      ...prev,
      [editId]: {
        email: data.email.trim(),
        status: data.status,
        joined: data.joined,
        lastActive: prev[editId]?.lastActive ?? '—',
      },
    }))

    showToast('Usuario actualizado', 'success')
    setEditId(null)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1 max-w-md w-full">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'active'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
          >
            Activos
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'inactive'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
          >
            Inactivos
          </button>
        </div>

        <Button onClick={() => setShowCreate(true)} className="bg-primary hover:bg-primary/90 w-full md:w-auto">
          + Nuevo Usuario
        </Button>
      </div>

      {/* Table */}
      <Card className="border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-3 text-left font-semibold text-foreground">Nombre</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Email</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Teléfono</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Unido</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Último Acceso</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Estado</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-3 font-medium text-foreground">{user.name}</td>
                  <td className="px-6 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-6 py-3 text-muted-foreground">{user.phone}</td>
                  <td className="px-6 py-3 text-muted-foreground text-xs">{user.joined}</td>
                  <td className="px-6 py-3 text-muted-foreground text-xs">{user.lastActive}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                      {user.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedUserId(selectedUserId === user.id ? null : user.id)}
                        className="p-1 hover:bg-muted rounded"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => openEdit(user.id)}
                        className="p-1 hover:bg-muted rounded"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1 hover:bg-red-100 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-sm text-muted-foreground" colSpan={7}>
                    No hay resultados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail (simulado) */}
      {selectedUser && (
        <Card className="border border-border p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Detalle de usuario</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Nombre:</span> {selectedUser.name}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Email:</span> {selectedUser.email}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Teléfono:</span> {selectedUser.phone}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Estado:</span>{' '}
                {selectedUser.status === 'active' ? 'Activo' : 'Inactivo'}
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelectedUserId(null)}>
                Cerrar
              </Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => openEdit(selectedUser.id)}>
                Editar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Pagination (mock) */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredUsers.length} de {users.length} usuarios
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Anterior
          </Button>
          <Button variant="outline" size="sm">
            Siguiente
          </Button>
        </div>
      </div>

      {/* Modales */}
      <UserFormModal
        open={showCreate}
        title="Nuevo Usuario"
        initial={{
          ...createInitial,
          joined: '2026-01-01',
        }}
        onClose={() => setShowCreate(false)}
        onSave={handleCreate}
      />

      <UserFormModal
        open={!!editId}
        title="Editar Usuario"
        initial={editInitial}
        onClose={() => setEditId(null)}
        onSave={handleEdit}
      />
    </div>
  )
}
