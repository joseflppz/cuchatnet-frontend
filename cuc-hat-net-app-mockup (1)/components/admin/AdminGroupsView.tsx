'use client'

import { Search, Edit, Trash2, Users, Eye, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEffect, useMemo, useState } from 'react'

type Group = {
  id: string
  name: string
  creator: string
  members: number
  created: string
  messages: number
  description?: string
}

const GROUPS_KEY = 'cuchatnet_admin_groups_v1'

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function todayISO() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function seedGroups(): Group[] {
  return [
    { id: 'g-1', name: 'Equipo Proyecto', creator: 'Juan Pérez', members: 8, created: '2026-01-15', messages: 234, description: 'Grupo para coordinar el proyecto.' },
    { id: 'g-2', name: 'Curso Ingeniería', creator: 'María Rodríguez', members: 45, created: '2026-01-20', messages: 1200, description: 'Avisos y coordinación del curso.' },
    { id: 'g-3', name: 'Administración', creator: 'Carlos López', members: 12, created: '2026-01-10', messages: 567, description: 'Temas administrativos internos.' },
    { id: 'g-4', name: 'Área de Tecnología', creator: 'Ana García', members: 32, created: '2026-01-25', messages: 890, description: 'Soporte y anuncios del área.' },
  ]
}

/** Modal Crear/Editar */
function GroupFormModal({
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
    creator: string
    members: number
    created: string
    messages: number
    description: string
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
            <label className="text-xs font-medium text-foreground">Nombre del grupo</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
              placeholder="Ej: Equipo Proyecto"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Creador</label>
            <input
              value={form.creator}
              onChange={(e) => setForm((p) => ({ ...p, creator: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Miembros</label>
              <input
                type="number"
                min={1}
                value={form.members}
                onChange={(e) => setForm((p) => ({ ...p, members: Number(e.target.value || 0) }))}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Mensajes</label>
              <input
                type="number"
                min={0}
                value={form.messages}
                onChange={(e) => setForm((p) => ({ ...p, messages: Number(e.target.value || 0) }))}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Creado</label>
            <input
              type="date"
              value={form.created}
              onChange={(e) => setForm((p) => ({ ...p, created: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-white focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Descripción (opcional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary resize-none"
              placeholder="Breve descripción del grupo..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={() => onSave(form)}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!form.name.trim() || !form.creator.trim() || form.members <= 0}
            >
              Guardar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Modal detalle */
function GroupDetailModal({
  open,
  group,
  onClose,
  onEdit,
}: {
  open: boolean
  group: Group | null
  onClose: () => void
  onEdit: (id: string) => void
}) {
  if (!open || !group) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full overflow-hidden border border-border">
        <div className="border-b border-border p-4 flex items-center justify-between">
          <h2 className="font-bold text-lg text-foreground">Detalle del grupo</h2>
          <button onClick={onClose} className="text-foreground/60 hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          <p className="text-sm text-foreground">
            <span className="font-semibold">Nombre:</span> {group.name}
          </p>
          <p className="text-sm text-foreground">
            <span className="font-semibold">Creador:</span> {group.creator}
          </p>
          <p className="text-sm text-foreground">
            <span className="font-semibold">Miembros:</span> {group.members}
          </p>
          <p className="text-sm text-foreground">
            <span className="font-semibold">Mensajes:</span> {group.messages}
          </p>
          <p className="text-sm text-foreground">
            <span className="font-semibold">Creado:</span> {group.created}
          </p>
          {group.description?.trim() ? (
            <p className="text-sm text-foreground">
              <span className="font-semibold">Descripción:</span> {group.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Sin descripción.</p>
          )}

          <div className="flex gap-2 pt-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cerrar
            </Button>
            <Button onClick={() => onEdit(group.id)} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
              Editar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminGroupsView() {
  const [searchTerm, setSearchTerm] = useState('')
  const [groups, setGroups] = useState<Group[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  // load
  useEffect(() => {
    const saved = safeParse<Group[]>(localStorage.getItem(GROUPS_KEY), [])
    if (saved.length > 0) setGroups(saved)
    else setGroups(seedGroups())
  }, [])

  // save
  useEffect(() => {
    if (groups.length === 0) return
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups))
  }, [groups])

  const filteredGroups = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return groups
    return groups.filter((g) => g.name.toLowerCase().includes(term) || g.creator.toLowerCase().includes(term))
  }, [groups, searchTerm])

  const detailGroup = groups.find((g) => g.id === detailId) || null

  const createInitial = {
    name: '',
    creator: '',
    members: 3,
    created: todayISO(),
    messages: 0,
    description: '',
  }

  const editInitial = useMemo(() => {
    const g = groups.find((x) => x.id === editId)
    return g
      ? {
        name: g.name,
        creator: g.creator,
        members: g.members,
        created: g.created,
        messages: g.messages,
        description: g.description ?? '',
      }
      : createInitial
  }, [editId, groups])

  const handleCreate = (data: typeof createInitial) => {
    const newGroup: Group = {
      id: `g-${Date.now()}`,
      name: data.name.trim(),
      creator: data.creator.trim(),
      members: Number(data.members || 0),
      created: data.created,
      messages: Number(data.messages || 0),
      description: data.description?.trim() || '',
    }
    setGroups((prev) => [newGroup, ...prev]) // arriba = más reciente
    setShowCreate(false)
  }

  const handleEdit = (data: typeof createInitial) => {
    if (!editId) return
    setGroups((prev) =>
      prev.map((g) =>
        g.id === editId
          ? {
            ...g,
            name: data.name.trim(),
            creator: data.creator.trim(),
            members: Number(data.members || 0),
            created: data.created,
            messages: Number(data.messages || 0),
            description: data.description?.trim() || '',
          }
          : g
      )
    )
    setEditId(null)
  }

  const handleDelete = (id: string) => {
    const ok = window.confirm('¿Eliminar este grupo? (Simulado)')
    if (!ok) return
    setGroups((prev) => prev.filter((g) => g.id !== id))
    if (detailId === id) setDetailId(null)
    if (editId === id) setEditId(null)
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
              placeholder="Buscar por grupo o creador..."
              className="w-full pl-9 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <Button onClick={() => setShowCreate(true)} className="bg-primary hover:bg-primary/90 w-full md:w-auto">
          + Nuevo Grupo
        </Button>
      </div>

      {/* Table */}
      <Card className="border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-3 text-left font-semibold text-foreground">Nombre del Grupo</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Creador</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Miembros</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Mensajes</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Creado</th>
                <th className="px-6 py-3 text-left font-semibold text-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((group) => (
                <tr key={group.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-3 font-medium text-foreground">{group.name}</td>
                  <td className="px-6 py-3 text-muted-foreground">{group.creator}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{group.members}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">{group.messages}</td>
                  <td className="px-6 py-3 text-muted-foreground text-xs">{group.created}</td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setDetailId(group.id)} className="p-1 hover:bg-muted rounded" title="Ver">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => setEditId(group.id)} className="p-1 hover:bg-muted rounded" title="Editar">
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(group.id)} className="p-1 hover:bg-red-100 rounded" title="Eliminar">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredGroups.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-sm text-muted-foreground" colSpan={6}>
                    No hay resultados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination (mock) */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredGroups.length} de {groups.length} grupos
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
      <GroupFormModal
        open={showCreate}
        title="Nuevo Grupo"
        initial={createInitial}
        onClose={() => setShowCreate(false)}
        onSave={handleCreate}
      />

      <GroupFormModal
        open={!!editId}
        title="Editar Grupo"
        initial={editInitial}
        onClose={() => setEditId(null)}
        onSave={handleEdit}
      />

      <GroupDetailModal
        open={!!detailId}
        group={detailGroup}
        onClose={() => setDetailId(null)}
        onEdit={(id) => {
          setDetailId(null)
          setEditId(id)
        }}
      />
    </div>
  )
}
