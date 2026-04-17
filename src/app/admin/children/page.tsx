'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, User } from 'lucide-react'
import { getAge, getTodayStr } from '@/lib/utils'
import type { Child } from '@/types'

const AVATAR_COLORS = [
  '#7C3AED', '#0D9488', '#EF4444', '#F59E0B',
  '#3B82F6', '#10B981', '#EC4899', '#8B5CF6',
]

function ChildForm({
  initial,
  onSave,
  onClose,
  loading,
}: {
  initial?: Partial<Child>
  onSave: (data: { name: string; avatarColor: string; birthdate: string }) => void
  onClose: () => void
  loading: boolean
}) {
  const [name, setName] = useState(initial?.name || '')
  const [avatarColor, setAvatarColor] = useState(initial?.avatar_color || '#7C3AED')
  const [birthdate, setBirthdate] = useState(initial?.birthdate || '')

  return (
    <div className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input
          className="mt-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Child's name"
        />
      </div>
      <div>
        <Label>Birthdate</Label>
        <Input
          className="mt-1"
          type="date"
          value={birthdate}
          max={getTodayStr()}
          onChange={(e) => setBirthdate(e.target.value)}
        />
      </div>
      <div>
        <Label>Avatar Color</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {AVATAR_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setAvatarColor(color)}
              className="w-8 h-8 rounded-full transition-transform hover:scale-110"
              style={{
                backgroundColor: color,
                outline: avatarColor === color ? `3px solid ${color}` : 'none',
                outlineOffset: '2px',
              }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button
          className="flex-1"
          onClick={() => onSave({ name, avatarColor, birthdate })}
          disabled={loading || !name.trim()}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

export default function AdminChildren() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editChild, setEditChild] = useState<Child | null>(null)

  const { data: children = [], isLoading } = useQuery<Child[]>({
    queryKey: ['children'],
    queryFn: () => fetch('/api/children').then((r) => r.json()),
  })

  const create = useMutation({
    mutationFn: (body: { name: string; avatarColor: string; birthdate: string }) =>
      fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return }
      toast.success('Child added!')
      qc.invalidateQueries({ queryKey: ['children'] })
      setCreateOpen(false)
    },
  })

  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: number; name: string; avatarColor: string; birthdate: string }) =>
      fetch(`/api/children/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return }
      toast.success('Updated!')
      qc.invalidateQueries({ queryKey: ['children'] })
      setEditChild(null)
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/children/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      toast.success('Child removed')
      qc.invalidateQueries({ queryKey: ['children'] })
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Children</h1>
          <p className="text-neutral-500 text-sm mt-1">Manage your household's kids</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Child
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Child</DialogTitle>
            </DialogHeader>
            <ChildForm
              onSave={(data) => create.mutate(data)}
              onClose={() => setCreateOpen(false)}
              loading={create.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-neutral-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : children.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-neutral-400">
            <User className="w-12 h-12 mb-3 opacity-30" />
            <p>No children yet. Add your first child!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((child) => (
            <Card key={child.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="h-2" style={{ backgroundColor: child.avatar_color }} />
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                        style={{ backgroundColor: child.avatar_color }}
                      >
                        {child.name[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{child.name}</h3>
                        {child.birthdate && (
                          <p className="text-sm text-neutral-500">{getAge(child.birthdate)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-neutral-400 hover:text-primary"
                        onClick={() => setEditChild(child)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-neutral-400 hover:text-red-500"
                        onClick={() => {
                          if (confirm(`Remove ${child.name}? This cannot be undone.`)) {
                            remove.mutate(child.id)
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editChild} onOpenChange={(o) => !o && setEditChild(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editChild?.name}</DialogTitle>
          </DialogHeader>
          {editChild && (
            <ChildForm
              initial={editChild}
              onSave={(data) => update.mutate({ id: editChild.id, ...data })}
              onClose={() => setEditChild(null)}
              loading={update.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
