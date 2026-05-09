'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, Play, PiggyBank, Target, RefreshCw } from 'lucide-react'
import { formatCents, dollarsToCents, getTodayStr } from '@/lib/utils'
import type { Child, PiggyTransaction, PiggyGoal, RecurringPiggyRule } from '@/types'

type Category = 'FUN' | 'SAVINGS' | 'DONATE'
type Cadence = 'DAILY' | 'WEEKLY' | 'MONTHLY'

const CATEGORY_COLORS: Record<Category, string> = {
  FUN: '#7C3AED',
  SAVINGS: '#0D9488',
  DONATE: '#FACC15',
}

export default function AdminPiggybank() {
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

  const { data: transactions = [] } = useQuery<PiggyTransaction[]>({
    queryKey: ['piggy-transactions', childId],
    queryFn: () => fetch(`/api/piggy/transactions?childId=${childId}`).then((r) => r.json()),
    enabled: !!childId,
  })

  const { data: balances = { FUN: 0, SAVINGS: 0, DONATE: 0 } } = useQuery<Record<Category, number>>({
    queryKey: ['piggy-balances', childId],
    queryFn: () => fetch(`/api/piggy/balances?childId=${childId}`).then((r) => r.json()),
    enabled: !!childId,
  })

  const { data: goals = [] } = useQuery<PiggyGoal[]>({
    queryKey: ['piggy-goals', childId],
    queryFn: () => fetch(`/api/piggy/goals?childId=${childId}`).then((r) => r.json()),
    enabled: !!childId,
  })

  const { data: recurringRules = [] } = useQuery<Array<RecurringPiggyRule & { childIds: number[] }>>({
    queryKey: ['piggy-recurring'],
    queryFn: () => fetch('/api/piggy/recurring').then((r) => r.json()),
  })

  // Transaction form
  const [txForm, setTxForm] = useState({ category: 'FUN' as Category, amount: '', title: '', date: getTodayStr() })
  const [txOpen, setTxOpen] = useState(false)

  const createTx = useMutation({
    mutationFn: () =>
      fetch('/api/piggy/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, category: txForm.category, amountCents: dollarsToCents(txForm.amount), title: txForm.title, date: txForm.date }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return }
      toast.success('Transaction added!')
      qc.invalidateQueries({ queryKey: ['piggy-transactions', childId] })
      qc.invalidateQueries({ queryKey: ['piggy-balances', childId] })
      setTxOpen(false)
      setTxForm({ category: 'FUN', amount: '', title: '', date: getTodayStr() })
    },
  })

  // Goal form
  const [goalForm, setGoalForm] = useState({ category: 'SAVINGS' as Category, title: '', target: '' })
  const [goalOpen, setGoalOpen] = useState(false)

  const createGoal = useMutation({
    mutationFn: () =>
      fetch('/api/piggy/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, category: goalForm.category, title: goalForm.title, targetAmountCents: dollarsToCents(goalForm.target) }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return }
      toast.success('Goal created!')
      qc.invalidateQueries({ queryKey: ['piggy-goals', childId] })
      setGoalOpen(false)
      setGoalForm({ category: 'SAVINGS', title: '', target: '' })
    },
  })

  const deleteGoal = useMutation({
    mutationFn: (id: number) => fetch(`/api/piggy/goals/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => { toast.success('Goal removed'); qc.invalidateQueries({ queryKey: ['piggy-goals', childId] }) },
  })

  // Recurring rule form
  const [ruleForm, setRuleForm] = useState({
    category: 'FUN' as Category, amount: '', title: '', cadence: 'WEEKLY' as Cadence,
    startDate: getTodayStr(), endDate: '', childIds: [] as number[],
  })
  const [ruleOpen, setRuleOpen] = useState(false)

  const createRule = useMutation({
    mutationFn: () =>
      fetch('/api/piggy/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: ruleForm.category, amountCents: dollarsToCents(ruleForm.amount),
          title: ruleForm.title, cadence: ruleForm.cadence, startDate: ruleForm.startDate,
          endDate: ruleForm.endDate || undefined, nextRunDate: ruleForm.startDate,
          childIds: ruleForm.childIds,
        }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return }
      toast.success('Recurring rule created!')
      qc.invalidateQueries({ queryKey: ['piggy-recurring'] })
      setRuleOpen(false)
      setRuleForm({ category: 'FUN', amount: '', title: '', cadence: 'WEEKLY', startDate: getTodayStr(), endDate: '', childIds: [] })
    },
  })

  const deleteRule = useMutation({
    mutationFn: (id: number) => fetch(`/api/piggy/recurring/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => { toast.success('Rule deleted'); qc.invalidateQueries({ queryKey: ['piggy-recurring'] }) },
  })

  const runRecurring = useMutation({
    mutationFn: () => fetch('/api/piggy/recurring/run', { method: 'POST' }).then((r) => r.json()),
    onSuccess: (data) => {
      toast.success(`Posted ${data.posted} transaction(s)`)
      qc.invalidateQueries({ queryKey: ['piggy-transactions'] })
      qc.invalidateQueries({ queryKey: ['piggy-balances'] })
      qc.invalidateQueries({ queryKey: ['piggy-recurring'] })
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Piggybank</h1>
          <p className="text-neutral-500 text-sm mt-1">Manage Fun, Savings & Donate accounts</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => runRecurring.mutate()} disabled={runRecurring.isPending}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Run Recurring
        </Button>
      </div>

      {/* Child selector */}
      {children.length > 0 && (
        <div className="flex gap-3 mb-6">
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedChild(c.id)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-medium text-sm transition-all ${
                childId === c.id
                  ? 'text-white shadow-md scale-105'
                  : 'bg-white border-2 border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:shadow-sm'
              }`}
              style={childId === c.id ? { backgroundColor: c.avatar_color, borderColor: c.avatar_color } : {}}
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ backgroundColor: childId === c.id ? 'rgba(255,255,255,0.3)' : c.avatar_color }}
              >
                {c.name[0]}
              </span>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Balance summary */}
      {childId && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {(['FUN', 'SAVINGS', 'DONATE'] as Category[]).map((cat) => (
            <Card key={cat} className="border-l-4" style={{ borderLeftColor: CATEGORY_COLORS[cat] }}>
              <CardContent className="p-4">
                <p className="text-xs text-neutral-500 uppercase font-medium">{cat}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: CATEGORY_COLORS[cat] }}>
                  {formatCents(balances[cat] || 0)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="recurring">Recurring</TabsTrigger>
        </TabsList>

        {/* TRANSACTIONS */}
        <TabsContent value="transactions" className="mt-4">
          <div className="flex justify-end mb-4">
            <Dialog open={txOpen} onOpenChange={setTxOpen}>
              <DialogTrigger asChild>
                <Button disabled={!childId}><Plus className="w-4 h-4 mr-2" />Add Transaction</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Transaction</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Child</Label>
                    <p className="text-sm font-medium mt-1">{children.find((c) => c.id === childId)?.name}</p>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={txForm.category} onValueChange={(v) => setTxForm((f) => ({ ...f, category: v as Category }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FUN">Fun</SelectItem>
                        <SelectItem value="SAVINGS">Savings</SelectItem>
                        <SelectItem value="DONATE">Donate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount ($)</Label>
                    <Input className="mt-1" type="number" step="0.01" value={txForm.amount} onChange={(e) => setTxForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input className="mt-1" value={txForm.title} onChange={(e) => setTxForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Weekly allowance" />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input className="mt-1" type="date" value={txForm.date} onChange={(e) => setTxForm((f) => ({ ...f, date: e.target.value }))} />
                  </div>
                  <Button className="w-full" onClick={() => createTx.mutate()} disabled={createTx.isPending || !txForm.amount || !txForm.title}>
                    {createTx.isPending ? 'Saving...' : 'Add Transaction'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-2">
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-neutral-400"><PiggyBank className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No transactions yet</p></div>
            ) : transactions.map((tx) => (
              <Card key={tx.id}>
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: CATEGORY_COLORS[tx.category as Category] }}>
                      {tx.category[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.title}</p>
                      <p className="text-xs text-neutral-500">{tx.date}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-sm" style={{ color: tx.amount_cents >= 0 ? '#0D9488' : '#EF4444' }}>
                    {tx.amount_cents >= 0 ? '+' : ''}{formatCents(tx.amount_cents)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* GOALS */}
        <TabsContent value="goals" className="mt-4">
          <div className="flex justify-end mb-4">
            <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
              <DialogTrigger asChild>
                <Button disabled={!childId}><Plus className="w-4 h-4 mr-2" />Add Goal</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Savings Goal</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={goalForm.category} onValueChange={(v) => setGoalForm((f) => ({ ...f, category: v as Category }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAVINGS">Savings</SelectItem>
                        <SelectItem value="DONATE">Donate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Goal Name</Label>
                    <Input className="mt-1" value={goalForm.title} onChange={(e) => setGoalForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. New Bike" />
                  </div>
                  <div>
                    <Label>Target Amount ($)</Label>
                    <Input className="mt-1" type="number" step="0.01" value={goalForm.target} onChange={(e) => setGoalForm((f) => ({ ...f, target: e.target.value }))} placeholder="80.00" />
                  </div>
                  <Button className="w-full" onClick={() => createGoal.mutate()} disabled={createGoal.isPending || !goalForm.title || !goalForm.target}>
                    {createGoal.isPending ? 'Saving...' : 'Create Goal'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-3">
            {goals.length === 0 ? (
              <div className="text-center py-12 text-neutral-400"><Target className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No goals yet</p></div>
            ) : goals.map((goal) => {
              const balance = balances[goal.category as Category] || 0
              const pct = Math.min(100, Math.round((balance / goal.target_amount_cents) * 100))
              return (
                <Card key={goal.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{goal.title}</p>
                        <p className="text-xs text-neutral-500">{goal.category} — Target: {formatCents(goal.target_amount_cents)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{pct}%</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-red-500"
                          onClick={() => deleteGoal.mutate(goal.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: CATEGORY_COLORS[goal.category as Category] }} />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* RECURRING */}
        <TabsContent value="recurring" className="mt-4">
          <div className="flex justify-end mb-4">
            <Dialog open={ruleOpen} onOpenChange={setRuleOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Add Rule</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Recurring Rule</DialogTitle></DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Category</Label>
                      <Select value={ruleForm.category} onValueChange={(v) => setRuleForm((f) => ({ ...f, category: v as Category }))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FUN">Fun</SelectItem>
                          <SelectItem value="SAVINGS">Savings</SelectItem>
                          <SelectItem value="DONATE">Donate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Cadence</Label>
                      <Select value={ruleForm.cadence} onValueChange={(v) => setRuleForm((f) => ({ ...f, cadence: v as Cadence }))}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DAILY">Daily</SelectItem>
                          <SelectItem value="WEEKLY">Weekly</SelectItem>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input className="mt-1" value={ruleForm.title} onChange={(e) => setRuleForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Weekly allowance" />
                  </div>
                  <div>
                    <Label>Amount ($)</Label>
                    <Input className="mt-1" type="number" step="0.01" value={ruleForm.amount} onChange={(e) => setRuleForm((f) => ({ ...f, amount: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Start Date</Label>
                      <Input className="mt-1" type="date" value={ruleForm.startDate} onChange={(e) => setRuleForm((f) => ({ ...f, startDate: e.target.value }))} />
                    </div>
                    <div>
                      <Label>End Date (opt)</Label>
                      <Input className="mt-1" type="date" value={ruleForm.endDate} onChange={(e) => setRuleForm((f) => ({ ...f, endDate: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label>Assign to Children</Label>
                    <div className="mt-2 space-y-2">
                      {children.map((child) => (
                        <div key={child.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`rc-${child.id}`}
                            checked={ruleForm.childIds.includes(child.id)}
                            onCheckedChange={() =>
                              setRuleForm((f) => ({
                                ...f,
                                childIds: f.childIds.includes(child.id) ? f.childIds.filter((c) => c !== child.id) : [...f.childIds, child.id],
                              }))
                            }
                          />
                          <label htmlFor={`rc-${child.id}`} className="text-sm cursor-pointer">{child.name}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => createRule.mutate()} disabled={createRule.isPending || !ruleForm.amount || !ruleForm.title}>
                    {createRule.isPending ? 'Saving...' : 'Create Rule'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-3">
            {recurringRules.length === 0 ? (
              <div className="text-center py-12 text-neutral-400"><RefreshCw className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No recurring rules yet</p></div>
            ) : recurringRules.map((rule) => {
              const ruleChildren = children.filter((c) => rule.childIds.includes(c.id))
              return (
                <Card key={rule.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge style={{ backgroundColor: CATEGORY_COLORS[rule.category as Category], color: 'white', border: 'none' }} className="text-xs">{rule.category}</Badge>
                        <p className="font-medium text-sm">{rule.title}</p>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        {formatCents(rule.amount_cents)} · {rule.cadence.toLowerCase()} · Next: {rule.next_run_date}
                      </p>
                      <div className="flex gap-1 mt-1">
                        {ruleChildren.map((c) => (
                          <span key={c.id} className="text-xs bg-neutral-100 px-2 py-0.5 rounded-full">{c.name}</span>
                        ))}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-red-500"
                      onClick={() => { if (confirm('Delete rule?')) deleteRule.mutate(rule.id) }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
