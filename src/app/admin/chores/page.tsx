'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Pencil, Trash2, ListChecks, GripVertical } from 'lucide-react'
import { getChoreIcon, CHORE_ICON_OPTIONS } from '@/lib/icons'
import { getDayName } from '@/lib/utils'
import type { Child, ChoreTemplate } from '@/types'

const DAY_OPTIONS = [0, 1, 2, 3, 4, 5, 6]

interface ChoreWithRules extends ChoreTemplate {
  chore_assignment_rules: Array<{
    id: number; child_id: number; days_of_week: string; active: boolean
    children: { name: string }
  }>
}

// ==========================================
// CHORE FORM
// ==========================================

function ChoreForm({
  initial,
  children,
  onSave,
  onClose,
  loading,
}: {
  initial?: Partial<ChoreWithRules>
  children: Child[]
  onSave: (data: {
    title: string; icon: string; points: number; timeOfDay: string
    assignments: Array<{ childId: number; daysOfWeek: number[] }>
  }) => void
  onClose: () => void
  loading: boolean
}) {
  const [title, setTitle] = useState(initial?.title || '')
  const [icon, setIcon] = useState(initial?.icon || 'sparkles')
  const [points, setPoints] = useState(initial?.points || 1)
  const [timeOfDay, setTimeOfDay] = useState(initial?.time_of_day || 'ALL_DAY')
  const [assignments, setAssignments] = useState<Record<number, number[]>>(() => {
    const init: Record<number, number[]> = {}
    for (const rule of initial?.chore_assignment_rules || []) {
      try { init[rule.child_id] = JSON.parse(rule.days_of_week) } catch { init[rule.child_id] = [] }
    }
    return init
  })

  function toggleDay(childId: number, day: number) {
    setAssignments((prev) => {
      const days = prev[childId] || []
      const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day]
      return { ...prev, [childId]: next.sort() }
    })
  }

  function toggleChild(childId: number) {
    setAssignments((prev) => {
      if (prev[childId] !== undefined) {
        const { [childId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [childId]: [0, 1, 2, 3, 4, 5, 6] }
    })
  }

  const IconComp = getChoreIcon(icon)

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div>
        <Label>Chore Name</Label>
        <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Make Bed" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Icon</Label>
          <Select value={icon} onValueChange={setIcon}>
            <SelectTrigger className="mt-1">
              <SelectValue>
                <span className="flex items-center gap-2">
                  <IconComp className="w-4 h-4" /> {icon}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {CHORE_ICON_OPTIONS.map((opt) => {
                const IC = getChoreIcon(opt.value)
                return (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      <IC className="w-4 h-4" /> {opt.label}
                    </span>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Points</Label>
          <Input
            className="mt-1"
            type="number"
            min={1}
            max={100}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
          />
        </div>
      </div>

      <div>
        <Label>Time of Day</Label>
        <Select value={timeOfDay} onValueChange={(v) => setTimeOfDay(v as 'MORNING' | 'AFTERNOON' | 'ALL_DAY')}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MORNING">Morning</SelectItem>
            <SelectItem value="AFTERNOON">Afternoon</SelectItem>
            <SelectItem value="ALL_DAY">All Day</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Assign to Children</Label>
        <div className="mt-2 space-y-4">
          {children.map((child) => {
            const assigned = assignments[child.id] !== undefined
            const days = assignments[child.id] || []
            return (
              <div key={child.id} className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    checked={assigned}
                    onCheckedChange={() => toggleChild(child.id)}
                    id={`child-${child.id}`}
                  />
                  <label htmlFor={`child-${child.id}`} className="font-medium text-sm cursor-pointer">
                    {child.name}
                  </label>
                </div>
                {assigned && (
                  <div className="flex flex-wrap gap-1 ml-6">
                    {DAY_OPTIONS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(child.id, day)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          days.includes(day)
                            ? 'bg-primary text-white'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        {getDayName(day)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {children.length === 0 && (
            <p className="text-sm text-neutral-400">Add children first to assign chores</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          className="flex-1"
          disabled={loading || !title.trim()}
          onClick={() =>
            onSave({
              title,
              icon,
              points,
              timeOfDay,
              assignments: Object.entries(assignments).map(([cid, daysOfWeek]) => ({
                childId: Number(cid),
                daysOfWeek,
              })),
            })
          }
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  )
}

// ==========================================
// SORTABLE CHORE ROW
// ==========================================

function SortableChoreRow({
  chore,
  onEdit,
  onDelete,
}: {
  chore: ChoreWithRules
  onEdit: (chore: ChoreWithRules) => void
  onDelete: (id: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: chore.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  const Icon = getChoreIcon(chore.icon)
  const assignedChildren = chore.chore_assignment_rules.filter((r) => r.active)

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {/* Drag handle */}
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-neutral-300 hover:text-neutral-500 touch-none"
              aria-label="Drag to reorder"
            >
              <GripVertical className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{chore.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-xs">{chore.points} pts</Badge>
                <Badge variant="outline" className="text-xs">{chore.time_of_day.replace('_', ' ')}</Badge>
                {assignedChildren.map((r) => (
                  <Badge key={r.id} className="text-xs bg-secondary/10 text-secondary border-0">
                    {r.children?.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-primary"
              onClick={() => onEdit(chore)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-red-500"
              onClick={() => { if (confirm('Delete chore?')) onDelete(chore.id) }}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ==========================================
// MAIN PAGE
// ==========================================

export default function AdminChores() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editChore, setEditChore] = useState<ChoreWithRules | null>(null)
  const [localChores, setLocalChores] = useState<ChoreWithRules[] | null>(null)

  const { data: fetchedChores = [], isLoading } = useQuery<ChoreWithRules[]>({
    queryKey: ['chores'],
    queryFn: () => fetch('/api/chores').then((r) => r.json()),
  })

  // Use local ordering while dragging; fall back to server data
  const chores = localChores ?? fetchedChores

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ['children'],
    queryFn: () => fetch('/api/children').then((r) => r.json()),
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  const reorder = useMutation({
    mutationFn: (ids: number[]) =>
      fetch('/api/chores/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chores'] })
      setLocalChores(null)
    },
    onError: () => {
      toast.error('Failed to save order')
      setLocalChores(null)
      qc.invalidateQueries({ queryKey: ['chores'] })
    },
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = chores.findIndex((c) => c.id === active.id)
    const newIndex = chores.findIndex((c) => c.id === over.id)
    const reordered = arrayMove(chores, oldIndex, newIndex)

    setLocalChores(reordered)
    reorder.mutate(reordered.map((c) => c.id))
  }

  const create = useMutation({
    mutationFn: (body: Parameters<typeof ChoreForm>[0]['onSave'] extends (d: infer D) => void ? D : never) =>
      fetch('/api/chores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return }
      toast.success('Chore created!')
      qc.invalidateQueries({ queryKey: ['chores'] })
      setLocalChores(null)
      setCreateOpen(false)
    },
  })

  const update = useMutation({
    mutationFn: async ({ id, assignments, ...body }: {
      id: number; title: string; icon: string; points: number; timeOfDay: string
      assignments: Array<{ childId: number; daysOfWeek: number[] }>
    }) => {
      await fetch(`/api/chores/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const oldRules = editChore?.chore_assignment_rules || []
      for (const rule of oldRules) {
        await fetch(`/api/chore-rules/${rule.id}`, { method: 'DELETE' })
      }
      for (const a of assignments) {
        await fetch('/api/chore-rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ choreTemplateId: id, childId: a.childId, daysOfWeek: a.daysOfWeek }),
        })
      }
    },
    onSuccess: () => {
      toast.success('Chore updated!')
      qc.invalidateQueries({ queryKey: ['chores'] })
      setEditChore(null)
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/chores/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      toast.success('Chore deleted')
      qc.invalidateQueries({ queryKey: ['chores'] })
      setLocalChores(null)
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Chores</h1>
          <p className="text-neutral-500 text-sm mt-1">Define and assign daily chores · drag to reorder</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Chore</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Chore</DialogTitle></DialogHeader>
            <ChoreForm
              children={children}
              onSave={(data) => create.mutate(data)}
              onClose={() => setCreateOpen(false)}
              loading={create.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-neutral-200 rounded-xl animate-pulse" />)}
        </div>
      ) : chores.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-neutral-400">
            <ListChecks className="w-12 h-12 mb-3 opacity-30" />
            <p>No chores yet. Create your first chore!</p>
          </CardContent>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={chores.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {chores.map((chore) => (
                <SortableChoreRow
                  key={chore.id}
                  chore={chore}
                  onEdit={setEditChore}
                  onDelete={(id) => remove.mutate(id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={!!editChore} onOpenChange={(o) => !o && setEditChore(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit {editChore?.title}</DialogTitle></DialogHeader>
          {editChore && (
            <ChoreForm
              initial={editChore}
              children={children}
              onSave={(data) => update.mutate({ id: editChore.id, ...data })}
              onClose={() => setEditChore(null)}
              loading={update.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
