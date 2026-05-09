'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import useEmblaCarousel from 'embla-carousel-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Star, Settings, LogOut, ChevronLeft, ChevronRight,
  CheckCircle2, Circle, PiggyBank, Target, Gift, Plus, Minus, ShoppingBag,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getChoreIcon } from '@/lib/icons'
import { formatCents, getTodayStr, getCurrentTimeOfDay, dollarsToCents } from '@/lib/utils'
import type {
  Child, DailyChore, ChildChallengeProgress, PiggyBalances,
  PointsSummary, PiggyGoal, Reward,
} from '@/types'

// ==========================================
// KID CARD — all data for one child
// ==========================================

function KidCard({ child }: { child: Child }) {
  const qc = useQueryClient()
  const today = getTodayStr()
  const currentPeriod = getCurrentTimeOfDay()

  const { data: chores = [] } = useQuery<DailyChore[]>({
    queryKey: ['daily-chores', child.id, today],
    queryFn: () => fetch(`/api/daily-chores?childId=${child.id}&date=${today}`).then((r) => r.json()),
  })

  const { data: challenges = [] } = useQuery<ChildChallengeProgress[]>({
    queryKey: ['child-challenges', child.id],
    queryFn: () => fetch(`/api/child-challenges?childId=${child.id}`).then((r) => r.json()),
  })

  const { data: balances = { FUN: 0, SAVINGS: 0, DONATE: 0 } } = useQuery<PiggyBalances>({
    queryKey: ['piggy-balances', child.id],
    queryFn: () => fetch(`/api/piggy/balances?childId=${child.id}`).then((r) => r.json()),
  })

  const { data: goals = [] } = useQuery<PiggyGoal[]>({
    queryKey: ['piggy-goals', child.id],
    queryFn: () => fetch(`/api/piggy/goals?childId=${child.id}`).then((r) => r.json()),
  })

  const { data: rewards = [] } = useQuery<Reward[]>({
    queryKey: ['rewards', child.id],
    queryFn: () => fetch(`/api/rewards?childId=${child.id}`).then((r) => r.json()),
  })

  const { data: summary } = useQuery<PointsSummary>({
    queryKey: ['points-summary', child.id],
    queryFn: () => fetch(`/api/points/summary?childId=${child.id}`).then((r) => r.json()),
  })

  const toggleChore = useMutation({
    mutationFn: ({ choreTemplateId }: { choreTemplateId: number }) =>
      fetch('/api/daily-chores/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: child.id, choreTemplateId, date: today }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.completed) toast.success('+Points earned!')
      qc.invalidateQueries({ queryKey: ['daily-chores', child.id, today] })
      qc.invalidateQueries({ queryKey: ['points-summary', child.id] })
    },
  })

  // Spend money dialog
  const [spendOpen, setSpendOpen] = useState(false)
  const [spendCat, setSpendCat] = useState<'FUN' | 'SAVINGS' | 'DONATE'>('FUN')
  const [spendAmount, setSpendAmount] = useState('')

  const spendMoney = useMutation({
    mutationFn: () =>
      fetch('/api/piggy/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: child.id,
          category: spendCat,
          amountCents: -dollarsToCents(spendAmount),
          title: `Spent from ${spendCat.charAt(0) + spendCat.slice(1).toLowerCase()}`,
          date: today,
        }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return }
      toast.success('Spent! 🛍️')
      qc.invalidateQueries({ queryKey: ['piggy-balances', child.id] })
      setSpendOpen(false)
      setSpendAmount('')
    },
  })

  const incrementChallenge = useMutation({
    mutationFn: ({ challengeId, delta }: { challengeId: number; delta: number }) =>
      fetch(`/api/challenges/${challengeId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: child.id, date: today, deltaCount: delta }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['child-challenges', child.id] })
      qc.invalidateQueries({ queryKey: ['points-summary', child.id] })
    },
  })

  const totalPoints = summary?.totalPoints || 0
  const activeRewards = rewards.filter((r) => r.active && !r.redeemed)
  const savingsGoal = goals.find((g) => g.category === 'SAVINGS' && g.active)
  const donateGoal = goals.find((g) => g.category === 'DONATE' && g.active)

  const morningChores = chores.filter((c) => c.timeOfDay === 'MORNING')
  const afternoonChores = chores.filter((c) => c.timeOfDay === 'AFTERNOON')
  const allDayChores = chores.filter((c) => c.timeOfDay === 'ALL_DAY')

  const completedCount = chores.filter((c) => c.completed).length
  const chorePercent = chores.length > 0 ? Math.round((completedCount / chores.length) * 100) : 0

  function ChoreItem({ chore }: { chore: DailyChore }) {
    const Icon = getChoreIcon(chore.icon)
    return (
      <button
        onClick={() => toggleChore.mutate({ choreTemplateId: chore.choreTemplateId })}
        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
          chore.completed
            ? 'bg-secondary/10 border border-secondary/20'
            : 'bg-white border border-neutral-200 hover:border-primary/30 hover:bg-primary-50'
        }`}
      >
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            chore.completed ? 'bg-secondary/20' : 'bg-neutral-100'
          }`}
        >
          <Icon className={`w-5 h-5 ${chore.completed ? 'text-secondary' : 'text-neutral-500'}`} />
        </div>
        <div className="flex-1 text-left">
          <p className={`text-sm font-medium ${chore.completed ? 'line-through text-neutral-400' : 'text-neutral-800'}`}>
            {chore.title}
          </p>
          <p className="text-xs text-neutral-400">+{chore.points} pts</p>
        </div>
        {chore.completed ? (
          <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
        ) : (
          <Circle className="w-5 h-5 text-neutral-300 flex-shrink-0" />
        )}
      </button>
    )
  }

  function ChoreSection({ title, chores, defaultOpen }: { title: string; chores: DailyChore[]; defaultOpen: boolean }) {
    if (chores.length === 0) return null
    const done = chores.filter((c) => c.completed).length
    return (
      <AccordionItem value={title} className="border-0">
        <AccordionTrigger className="py-2 hover:no-underline">
          <span className="flex items-center gap-2 text-sm font-semibold text-neutral-600">
            {title}
            <Badge variant="outline" className="text-xs font-normal">
              {done}/{chores.length}
            </Badge>
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-0">
          <div className="space-y-2">
            {chores.map((chore) => <ChoreItem key={chore.choreTemplateId} chore={chore} />)}
          </div>
        </AccordionContent>
      </AccordionItem>
    )
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Child header */}
      <div
        className="rounded-2xl p-5 text-white"
        style={{ background: `linear-gradient(135deg, ${child.avatar_color}, ${child.avatar_color}cc)` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
              {child.name[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold">{child.name}</h2>
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-3.5 h-3.5 text-yellow-300" />
                <span className="text-sm font-semibold">{totalPoints} pts</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/70">Today</p>
            <p className="text-lg font-bold">{chorePercent}%</p>
          </div>
        </div>
        <div className="mt-3">
          <Progress
            value={chorePercent}
            className="h-2 bg-white/20"
          />
        </div>
      </div>

      {/* Rewards */}
      {activeRewards.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-2">
            <Gift className="w-4 h-4 text-accent-500" />
            Rewards
          </h3>
          <div className="space-y-2">
            {activeRewards.map((reward) => {
              const pct = Math.min(100, Math.round((totalPoints / reward.target_points) * 100))
              return (
                <div key={reward.id} className="bg-white border border-neutral-200 rounded-xl p-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium">{reward.title}</span>
                    <span className="text-xs text-neutral-500">{totalPoints}/{reward.target_points}</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Chores */}
      {chores.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-2">
            <CheckCircle2 className="w-4 h-4 text-secondary" />
            Today&apos;s Chores
          </h3>

          {/* All Day chores always visible */}
          {allDayChores.length > 0 && (
            <div className="space-y-2 mb-2">
              {allDayChores.map((chore) => <ChoreItem key={chore.choreTemplateId} chore={chore} />)}
            </div>
          )}

          {/* Morning/Afternoon as accordion */}
          {(morningChores.length > 0 || afternoonChores.length > 0) && (
            <Accordion type="multiple" defaultValue={[currentPeriod === 'MORNING' ? 'Morning' : 'Afternoon']} className="space-y-1">
              <ChoreSection title="Morning" chores={morningChores} defaultOpen={currentPeriod === 'MORNING'} />
              <ChoreSection title="Afternoon" chores={afternoonChores} defaultOpen={currentPeriod === 'AFTERNOON'} />
            </Accordion>
          )}
        </section>
      )}

      {/* Challenges */}
      {challenges.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-2">
            <Target className="w-4 h-4 text-primary" />
            Challenges
          </h3>
          <div className="space-y-2">
            {challenges.map((ch) => {
              const pct = Math.min(100, Math.round((ch.currentCount / ch.targetCount) * 100))
              return (
                <div key={ch.challengeId} className="bg-white border border-neutral-200 rounded-xl p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{ch.title}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => ch.currentCount > 0 && incrementChallenge.mutate({ challengeId: ch.challengeId, delta: -1 })}
                        disabled={ch.currentCount === 0 || incrementChallenge.isPending}
                        className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 disabled:opacity-40"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs text-neutral-500 w-12 text-center">{ch.currentCount}/{ch.targetCount}</span>
                      <button
                        onClick={() => incrementChallenge.mutate({ challengeId: ch.challengeId, delta: 1 })}
                        disabled={ch.currentCount >= ch.targetCount || incrementChallenge.isPending}
                        className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 disabled:opacity-40"
                      >
                        <Plus className="w-3 h-3 text-primary" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-400 mb-1.5">{ch.goalDescription}</p>
                  <Progress value={pct} className="h-1.5" />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Piggybank */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
            <PiggyBank className="w-4 h-4 text-secondary" />
            Piggybank
          </h3>
          <button
            onClick={() => setSpendOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Spend
          </button>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3">
          {([['FUN', '#7C3AED'], ['SAVINGS', '#0D9488'], ['DONATE', '#FACC15']] as [string, string][]).map(([cat, color]) => (
            <div key={cat}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium" style={{ color }}>{cat}</span>
                <span className="text-neutral-600 font-semibold">{formatCents(balances[cat as keyof PiggyBalances])}</span>
              </div>
              {(() => {
                const goal = cat === 'SAVINGS' ? savingsGoal : cat === 'DONATE' ? donateGoal : undefined
                if (!goal) return null
                const pct = Math.min(100, Math.round((balances[cat as keyof PiggyBalances] / goal.target_amount_cents) * 100))
                return (
                  <div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">Goal: {goal.title} ({formatCents(goal.target_amount_cents)})</p>
                  </div>
                )
              })()}
            </div>
          ))}
        </div>

        {/* Spend dialog */}
        <Dialog open={spendOpen} onOpenChange={(o) => { setSpendOpen(o); if (!o) setSpendAmount('') }}>
          <DialogContent className="max-w-sm mx-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                Spend Money
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-1">
              {/* Account selector */}
              <div>
                <p className="text-sm font-medium text-neutral-600 mb-2">Which account?</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ['FUN', '#7C3AED'],
                    ['SAVINGS', '#0D9488'],
                    ['DONATE', '#FACC15'],
                  ] as ['FUN' | 'SAVINGS' | 'DONATE', string][]).map(([cat, color]) => {
                    const bal = balances[cat]
                    const active = spendCat === cat
                    return (
                      <button
                        key={cat}
                        onClick={() => setSpendCat(cat)}
                        className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                          active ? 'text-white shadow-md' : 'bg-white text-neutral-600 hover:shadow-sm'
                        }`}
                        style={{
                          backgroundColor: active ? color : undefined,
                          borderColor: active ? color : '#e5e7eb',
                        }}
                      >
                        <span className="text-xs font-bold">{cat.charAt(0) + cat.slice(1).toLowerCase()}</span>
                        <span className={`text-xs mt-0.5 ${active ? 'text-white/80' : 'text-neutral-400'}`}>
                          {formatCents(bal)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Amount input */}
              <div>
                <p className="text-sm font-medium text-neutral-600 mb-2">How much?</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">$</span>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={spendAmount}
                    onChange={(e) => setSpendAmount(e.target.value)}
                    className="pl-7 text-lg font-semibold"
                  />
                </div>
                {spendAmount && dollarsToCents(spendAmount) > balances[spendCat] && (
                  <p className="text-xs text-red-500 mt-1">Not enough in {spendCat.charAt(0) + spendCat.slice(1).toLowerCase()}</p>
                )}
              </div>

              {/* Confirm button */}
              <Button
                className="w-full h-12 text-base font-semibold"
                disabled={
                  spendMoney.isPending ||
                  !spendAmount ||
                  dollarsToCents(spendAmount) <= 0 ||
                  dollarsToCents(spendAmount) > balances[spendCat]
                }
                onClick={() => spendMoney.mutate()}
              >
                {spendMoney.isPending ? 'Spending...' : `Spend ${spendAmount ? formatCents(dollarsToCents(spendAmount)) : ''}`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  )
}

// ==========================================
// MAIN KIDS PAGE
// ==========================================

export default function KidsPage() {
  const router = useRouter()
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start' })

  const { data: children = [], isLoading } = useQuery<Child[]>({
    queryKey: ['children'],
    queryFn: () => fetch('/api/children').then((r) => r.json()),
  })

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    toast.success('See you later!')
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top bar */}
      <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <Star className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-primary text-lg">Missionly</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin')} className="text-neutral-500">
            <Settings className="w-4 h-4 mr-1.5" />
            Admin
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-neutral-500">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-96 bg-neutral-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : children.length === 0 ? (
          <div className="text-center py-24">
            <Star className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
            <h2 className="text-xl font-bold text-neutral-600">No children yet</h2>
            <p className="text-neutral-400 mt-2">Go to Admin to add children to your household</p>
            <Button className="mt-6" onClick={() => router.push('/admin/children')}>
              Go to Admin
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Carousel */}
            <div className="relative">
              {children.length > 2 && (
                <>
                  <button
                    onClick={scrollPrev}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-neutral-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={scrollNext}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-neutral-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
              <div className="embla" ref={emblaRef}>
                <div className="embla__container">
                  {children.map((child) => (
                    <div
                      key={child.id}
                      className="embla__slide"
                      style={{ width: children.length === 1 ? '100%' : 'min(400px, 85vw)' }}
                    >
                      <div className="bg-neutral-100 rounded-2xl p-4 space-y-4 h-full overflow-y-auto max-h-[80vh]">
                        <KidCard child={child} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
