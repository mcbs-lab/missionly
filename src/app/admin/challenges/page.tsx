'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Pencil, Trash2, Target } from 'lucide-react'
import type { Child, Challenge } from '@/types'

interface ChallengeWithAssignments extends Challenge {
  childIds: number[]
  challenge_assignments: Array<{ child_id: number }>
}

interface ChallengeProgress {
  challengeId: number; title: string; goalDescription: string
  targetCount: number; pointsPerUnit: number; currentCount: number
}

function ChallengeForm({
  initial, children, onSave, onClose, loading,
}: {
  initial?: Partial<ChallengeWithAssignments>
  children: Child[]
  onSave: (data: {
    title: string; goalDescription: string; targetCount: number
    pointsPerUnit: number; childIds: number[]
  }) => void
  onClose: () => void
  loading: boolean
}) {
  const [title, setTitle] = useState(initial?.title || '')
  const [goalDescription, setGoalDescription] = useState(initial?.goal_description || '')
  const [targetCount, setTargetCount] = useState(initial?.target_count || 10)
  const [pointsPerUnit, setPointsPerUnit] = useState(initial?.points_per_unit || 1)
  const [selectedChildren, setSelectedChildren] = useState<number[]>(initial?.childIds || [])

  function toggleChild(id: number) {
    setSelectedChildren((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Challenge Title</Label>
        <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Reading Champion" />
      </div>
      <div>
        <Label>Goal Description</Label>
        <Input className="mt-1" value={goalDescription} onChange={(e) => setGoalDescription(e.target.value)} placeholder="e.g. Read 20 books this month" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Target Count</Label>
          <Input className="mt-1" type="number" min={1} value={targetCount} onChange={(e) => setTargetCount(Number(e.target.value))} />
        </div>
        <div>
          <Label>Points per Unit</Label>
          <Input className="mt-1" type="number" min={1} value={pointsPerUnit} onChange={(e) => setPointsPerUnit(Number(e.target.value))} />
        </div>
      </div>
      <div>
        <Label>Assign to Children</Label>
        <div className="mt-2 space-y-2">
          {children.map((child) => (
            <div key={child.id} className="flex items-center gap-2">
              <Checkbox
                id={`ch-${child.id}`}
                checked={selectedChildren.includes(child.id)}
                onCheckedChange={() => toggleChild(child.id)}
              />
              <label htmlFor={`ch-${child.id}`} className="text-sm cursor-pointer">{child.name}</label>
            </div>
          ))}
          {children.length === 0 && <p className="text-sm text-neutral-400">Add children first</p>}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button
          className="flex-1"
          disabled={loading || !title.trim() || !goalDescription.trim()}
          onClick={() => onSave({ title, goalDescription, targetCount, pointsPerUnit, childIds: selectedChildren })}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  )
}

function ProgressEntryDialog({ challenge, children }: { challenge: ChallengeWithAssignments; children: Child[] }) {
  const [open, setOpen] = useState(false)
  const [childId, setChildId] = useState(challenge.childIds[0] || 0)
  const [delta, setDelta] = useState(1)
  const [note, setNote] = useState('')
  const qc = useQueryClient()

  const log = useMutation({
    mutationFn: () =>
      fetch(`/api/challenges/${challenge.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, date: new Date().toISOString().split('T')[0], deltaCount: delta, note }),
      }).then((r) => r.json()),
    onSuccess: () => {
      toast.success('Progress logged!')
      qc.invalidateQueries({ queryKey: ['challenge-progress'] })
      setOpen(false)
      setNote('')
    },
  })

  const assignedChildren = children.filter((c) => challenge.childIds.includes(c.id))
  if (assignedChildren.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs">Log Progress</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Log Progress — {challenge.title}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Child</Label>
            <select
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
              value={childId}
              onChange={(e) => setChildId(Number(e.target.value))}
            >
              {assignedChildren.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Units Completed</Label>
            <Input className="mt-1" type="number" min={1} value={delta} onChange={(e) => setDelta(Number(e.target.value))} />
          </div>
          <div>
            <Label>Note (optional)</Label>
            <Input className="mt-1" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Brief note..." />
          </div>
          <Button className="w-full" onClick={() => log.mutate()} disabled={log.isPending}>
            {log.isPending ? 'Saving...' : 'Log Progress'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminChallenges() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editChallenge, setEditChallenge] = useState<ChallengeWithAssignments | null>(null)

  const { data: challenges = [], isLoading } = useQuery<ChallengeWithAssignments[]>({
    queryKey: ['challenges'],
    queryFn: () => fetch('/api/challenges').then((r) => r.json()),
  })

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ['children'],
    queryFn: () => fetch('/api/children').then((r) => r.json()),
  })

  const { data: allProgress = [] } = useQuery<ChallengeProgress[]>({
    queryKey: ['challenge-progress', 'all'],
    queryFn: async () => {
      const results: ChallengeProgress[] = []
      for (const child of children) {
        const data: ChallengeProgress[] = await fetch(`/api/child-challenges?childId=${child.id}`).then((r) => r.json())
        results.push(...data)
      }
      return results
    },
    enabled: children.length > 0,
  })

  const create = useMutation({
    mutationFn: (body: { title: string; goalDescription: string; targetCount: number; pointsPerUnit: number; childIds: number[] }) =>
      fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return }
      toast.success('Challenge created!')
      qc.invalidateQueries({ queryKey: ['challenges'] })
      setCreateOpen(false)
    },
  })

  const update = useMutation({
    mutationFn: async ({ id, childIds, ...body }: {
      id: number; title: string; goalDescription: string
      targetCount: number; pointsPerUnit: number; childIds: number[]
    }) => {
      await fetch(`/api/challenges/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      await fetch('/api/challenges/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: id, childIds }),
      })
    },
    onSuccess: () => {
      toast.success('Updated!')
      qc.invalidateQueries({ queryKey: ['challenges'] })
      setEditChallenge(null)
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/challenges/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      toast.success('Challenge deleted')
      qc.invalidateQueries({ queryKey: ['challenges'] })
    },
  })

  function getProgress(challengeId: number, childId: number) {
    return allProgress.find((p) => p.challengeId === challengeId && children.find((c) => c.id === childId))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Challenges</h1>
          <p className="text-neutral-500 text-sm mt-1">Progress-based goals for your kids</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Challenge</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Challenge</DialogTitle></DialogHeader>
            <ChallengeForm children={children} onSave={(data) => create.mutate(data)} onClose={() => setCreateOpen(false)} loading={create.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-24 bg-neutral-200 rounded-xl animate-pulse" />)}
        </div>
      ) : challenges.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-neutral-400">
            <Target className="w-12 h-12 mb-3 opacity-30" />
            <p>No challenges yet. Create your first challenge!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {challenges.map((challenge) => {
            const assignedChildren = children.filter((c) => challenge.childIds.includes(c.id))
            return (
              <Card key={challenge.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{challenge.title}</h3>
                      <p className="text-sm text-neutral-500">{challenge.goal_description}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">Goal: {challenge.target_count}</Badge>
                        <Badge variant="outline" className="text-xs">{challenge.points_per_unit} pts/unit</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 items-center">
                      <ProgressEntryDialog challenge={challenge} children={children} />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-primary"
                        onClick={() => setEditChallenge(challenge)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-red-500"
                        onClick={() => { if (confirm('Delete challenge?')) remove.mutate(challenge.id) }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  {assignedChildren.length > 0 && (
                    <div className="space-y-2">
                      {assignedChildren.map((child) => {
                        const prog = allProgress.find((p) => p.challengeId === challenge.id)
                        const current = prog?.currentCount || 0
                        const pct = Math.min(100, Math.round((current / challenge.target_count) * 100))
                        return (
                          <div key={child.id} className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0"
                              style={{ backgroundColor: child.avatar_color }}>
                              {child.name[0]}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-1">
                                <span>{child.name}</span>
                                <span className="text-neutral-500">{current}/{challenge.target_count}</span>
                              </div>
                              <Progress value={pct} className="h-2" />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={!!editChallenge} onOpenChange={(o) => !o && setEditChallenge(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit {editChallenge?.title}</DialogTitle></DialogHeader>
          {editChallenge && (
            <ChallengeForm
              initial={editChallenge}
              children={children}
              onSave={(data) => update.mutate({ id: editChallenge.id, ...data })}
              onClose={() => setEditChallenge(null)}
              loading={update.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
