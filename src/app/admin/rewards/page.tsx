'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2, Star, Gift, CheckCircle2 } from 'lucide-react'
import { getTodayStr } from '@/lib/utils'
import type { Child, Reward, PointAdjustment, PointsSummary } from '@/types'

export default function AdminRewards() {
  const qc = useQueryClient()
  const [selectedChild, setSelectedChild] = useState<number | null>(null)

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ['children'],
    queryFn: () => fetch('/api/children').then((r) => r.json()),
  })

  useEffect(() => {
    if (children.length > 0 && !selectedChild) setSelectedChild(children[0].id)
  }, [children, selectedChild])

  const childId = selectedChild || children[0]?.id

  const { data: rewards = [] } = useQuery<Reward[]>({
    queryKey: ['rewards', childId],
    queryFn: () => fetch(`/api/rewards?childId=${childId}`).then((r) => r.json()),
    enabled: !!childId,
  })

  const { data: adjustments = [] } = useQuery<PointAdjustment[]>({
    queryKey: ['adjustments', childId],
    queryFn: () => fetch(`/api/points/adjustments?childId=${childId}`).then((r) => r.json()),
    enabled: !!childId,
  })

  const { data: summary } = useQuery<PointsSummary>({
    queryKey: ['points-summary', childId],
    queryFn: () => fetch(`/api/points/summary?childId=${childId}`).then((r) => r.json()),
    enabled: !!childId,
  })

  // Reward form
  const [rwForm, setRwForm] = useState({ title: '', targetPoints: '' })
  const [rwOpen, setRwOpen] = useState(false)

  const createReward = useMutation({
    mutationFn: () =>
      fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, title: rwForm.title, targetPoints: Number(rwForm.targetPoints) }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return }
      toast.success('Reward created!')
      qc.invalidateQueries({ queryKey: ['rewards', childId] })
      setRwOpen(false)
      setRwForm({ title: '', targetPoints: '' })
    },
  })

  const updateReward = useMutation({
    mutationFn: ({ id, ...body }: { id: number; redeemed?: boolean; active?: boolean }) =>
      fetch(`/api/rewards/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      toast.success('Reward updated')
      qc.invalidateQueries({ queryKey: ['rewards', childId] })
    },
  })

  const deleteReward = useMutation({
    mutationFn: (id: number) => fetch(`/api/rewards/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => { toast.success('Reward deleted'); qc.invalidateQueries({ queryKey: ['rewards', childId] }) },
  })

  // Adjustment form
  const [adjForm, setAdjForm] = useState({ points: '', reason: '', date: getTodayStr() })
  const [adjOpen, setAdjOpen] = useState(false)

  const createAdj = useMutation({
    mutationFn: () =>
      fetch('/api/points/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, points: Number(adjForm.points), reason: adjForm.reason, date: adjForm.date }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return }
      toast.success('Adjustment logged!')
      qc.invalidateQueries({ queryKey: ['adjustments', childId] })
      qc.invalidateQueries({ queryKey: ['points-summary', childId] })
      setAdjOpen(false)
      setAdjForm({ points: '', reason: '', date: getTodayStr() })
    },
  })

  const totalPoints = summary?.totalPoints || 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Rewards & Points</h1>
          <p className="text-neutral-500 text-sm mt-1">Manage goals, rewards and point adjustments</p>
        </div>
        {children.length > 1 && (
          <select
            className="border rounded-md px-3 py-2 text-sm"
            value={childId || ''}
            onChange={(e) => setSelectedChild(Number(e.target.value))}
          >
            {children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {/* Points summary */}
      {summary && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: totalPoints, color: '#7C3AED' },
            { label: 'Chores', value: summary.chorePoints, color: '#0D9488' },
            { label: 'Challenges', value: summary.challengePoints, color: '#3B82F6' },
            { label: 'Adjustments', value: summary.adjustmentPoints, color: '#FACC15' },
          ].map((s) => (
            <Card key={s.label} className="border-l-4" style={{ borderLeftColor: s.color }}>
              <CardContent className="p-3">
                <p className="text-xs text-neutral-500">{s.label}</p>
                <p className="text-xl font-bold" style={{ color: s.color }}>{s.value} pts</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="rewards">
        <TabsList>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="adjustments">Point Adjustments</TabsTrigger>
        </TabsList>

        <TabsContent value="rewards" className="mt-4">
          <div className="flex justify-end mb-4">
            <Dialog open={rwOpen} onOpenChange={setRwOpen}>
              <DialogTrigger asChild>
                <Button disabled={!childId}><Plus className="w-4 h-4 mr-2" />Add Reward</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Reward Goal</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Child</Label>
                    <select
                      className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                      value={childId || ''}
                      onChange={(e) => setSelectedChild(Number(e.target.value))}
                    >
                      {children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Reward Name</Label>
                    <Input className="mt-1" value={rwForm.title} onChange={(e) => setRwForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Movie night" />
                  </div>
                  <div>
                    <Label>Points Needed</Label>
                    <Input className="mt-1" type="number" min={1} value={rwForm.targetPoints} onChange={(e) => setRwForm((f) => ({ ...f, targetPoints: e.target.value }))} />
                  </div>
                  <Button className="w-full" onClick={() => createReward.mutate()} disabled={createReward.isPending || !rwForm.title || !rwForm.targetPoints}>
                    {createReward.isPending ? 'Saving...' : 'Create Reward'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-3">
            {rewards.length === 0 ? (
              <div className="text-center py-12 text-neutral-400">
                <Gift className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No rewards yet</p>
              </div>
            ) : rewards.map((reward) => {
              const pct = Math.min(100, Math.round((totalPoints / reward.target_points) * 100))
              return (
                <Card key={reward.id} className={reward.redeemed ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {reward.redeemed ? (
                          <CheckCircle2 className="w-5 h-5 text-secondary" />
                        ) : (
                          <Star className="w-5 h-5 text-accent-500" />
                        )}
                        <div>
                          <p className="font-medium">{reward.title}</p>
                          <p className="text-xs text-neutral-500">{totalPoints}/{reward.target_points} pts ({pct}%)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!reward.redeemed && totalPoints >= reward.target_points && (
                          <Button size="sm" className="h-8 text-xs bg-secondary hover:bg-secondary-600"
                            onClick={() => updateReward.mutate({ id: reward.id, redeemed: true })}>
                            Redeem
                          </Button>
                        )}
                        {reward.redeemed && (
                          <Badge variant="secondary" className="text-xs">Redeemed</Badge>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-red-500"
                          onClick={() => deleteReward.mutate(reward.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="adjustments" className="mt-4">
          <div className="flex justify-end mb-4">
            <Dialog open={adjOpen} onOpenChange={setAdjOpen}>
              <DialogTrigger asChild>
                <Button disabled={!childId}><Plus className="w-4 h-4 mr-2" />Add Adjustment</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Point Adjustment</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Child</Label>
                    <select
                      className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                      value={childId || ''}
                      onChange={(e) => setSelectedChild(Number(e.target.value))}
                    >
                      {children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Points (use negative to deduct)</Label>
                    <Input className="mt-1" type="number" value={adjForm.points} onChange={(e) => setAdjForm((f) => ({ ...f, points: e.target.value }))} placeholder="+10 or -5" />
                  </div>
                  <div>
                    <Label>Reason</Label>
                    <Input className="mt-1" value={adjForm.reason} onChange={(e) => setAdjForm((f) => ({ ...f, reason: e.target.value }))} placeholder="e.g. Helped a neighbor" />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input className="mt-1" type="date" value={adjForm.date} onChange={(e) => setAdjForm((f) => ({ ...f, date: e.target.value }))} />
                  </div>
                  <Button className="w-full" onClick={() => createAdj.mutate()} disabled={createAdj.isPending || !adjForm.points || !adjForm.reason}>
                    {createAdj.isPending ? 'Saving...' : 'Log Adjustment'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-2">
            {adjustments.length === 0 ? (
              <div className="text-center py-12 text-neutral-400"><Star className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No adjustments yet</p></div>
            ) : adjustments.map((adj) => (
              <Card key={adj.id}>
                <CardContent className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium">{adj.reason}</p>
                    <p className="text-xs text-neutral-500">{adj.date}</p>
                  </div>
                  <span className={`font-bold text-sm ${adj.points >= 0 ? 'text-secondary' : 'text-red-500'}`}>
                    {adj.points >= 0 ? '+' : ''}{adj.points} pts
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
