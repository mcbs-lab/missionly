'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import useEmblaCarousel from 'embla-carousel-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  Star, Settings, LogOut, ChevronLeft, ChevronRight,
  CheckCircle2, Circle, Trophy, PiggyBank, Target, Gift,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getChoreIcon } from '@/lib/icons'
import { formatCents, getTodayStr, getCurrentTimeOfDay } from '@/lib/utils'
import type {
  Child, DailyChore, ChildChallengeProgress, PiggyBalances,
  PointsSummary, PiggyGoal, Reward, LeaderboardEntry,
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
                    <span className="text-xs text-neutral-500">{ch.currentCount}/{ch.targetCount}</span>
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
        <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-2">
          <PiggyBank className="w-4 h-4 text-secondary" />
          Piggybank
        </h3>
        <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3">
          {([['FUN', '#7C3AED'], ['SAVINGS', '#0D9488'], ['DONATE', '#FACC15']] as [string, string][]).map(([cat, color]) => (
            <div key={cat}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium" style={{ color }}>{cat}</span>
                <span className="text-neutral-600 font-semibold">{formatCents(balances[cat as keyof PiggyBalances])}</span>
              </div>
              {cat !== 'FUN' && (() => {
                const goal = cat === 'SAVINGS' ? savingsGoal : donateGoal
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
              {cat === 'FUN' && (
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: '100%', backgroundColor: color, opacity: 0.3 }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// ==========================================
// LEADERBOARD
// ==========================================

function Leaderboard() {
  const [range, setRange] = useState<'today' | 'week' | 'month' | 'all'>('all')

  const { data: entries = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', range],
    queryFn: () => fetch(`/api/leaderboard?range=${range}`).then((r) => r.json()),
  })

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
          <Trophy className="w-4 h-4 text-accent-500" />
          Leaderboard
        </h3>
        <div className="flex gap-1">
          {(['today', 'week', 'month', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                range === r ? 'bg-primary text-white' : 'text-neutral-500 hover:bg-neutral-100'
              }`}
            >
              {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {entries.map((entry, i) => (
          <div key={entry.childId} className="flex items-center gap-3">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
              i === 0 ? 'bg-accent text-accent-foreground' : 'bg-neutral-100 text-neutral-500'
            }`}>
              {i + 1}
            </span>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: entry.avatarColor }}>
              {entry.childName[0]}
            </div>
            <span className="flex-1 text-sm font-medium">{entry.childName}</span>
            <span className="text-sm font-bold text-primary">{entry.totalPoints} pts</span>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-center text-sm text-neutral-400 py-4">No data yet</p>
        )}
      </div>
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

            {/* Leaderboard (shown when 2+ children) */}
            {children.length >= 2 && <Leaderboard />}
          </div>
        )}
      </main>
    </div>
  )
}
