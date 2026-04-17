'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Shield, Plus, Trash2, Users, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface HouseholdRow {
  id: number
  name: string
  created_at: string
  memberCount: number
}

export default function PlatformAdminDashboard() {
  const router = useRouter()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  const { data: households = [], isLoading } = useQuery<HouseholdRow[]>({
    queryKey: ['platform-households'],
    queryFn: () => fetch('/api/platform/households').then((r) => r.json()),
  })

  const create = useMutation({
    mutationFn: (body: typeof form) =>
      fetch('/api/platform/households', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.error) { toast.error(data.error); return }
      toast.success('Household created')
      qc.invalidateQueries({ queryKey: ['platform-households'] })
      setOpen(false)
      setForm({ name: '', email: '', password: '' })
    },
    onError: () => toast.error('Failed to create'),
  })

  const remove = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/platform/households/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      toast.success('Household deleted')
      qc.invalidateQueries({ queryKey: ['platform-households'] })
    },
  })

  async function handleLogout() {
    await fetch('/api/auth/platform', { method: 'DELETE' })
    router.push('/platform-admin/login')
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <header className="bg-neutral-800 border-b border-neutral-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold">Platform Admin</h1>
            <p className="text-xs text-neutral-400">Missionly Management</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-neutral-400 hover:text-white"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Households</h2>
            <p className="text-neutral-400 text-sm">{households.length} registered families</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-secondary hover:bg-secondary-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Household
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-800 border-neutral-700 text-white">
              <DialogHeader>
                <DialogTitle>Create Household</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-neutral-300">Family Name</Label>
                  <Input
                    className="bg-neutral-700 border-neutral-600 text-white mt-1"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="The Smith Family"
                  />
                </div>
                <div>
                  <Label className="text-neutral-300">Email</Label>
                  <Input
                    className="bg-neutral-700 border-neutral-600 text-white mt-1"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="family@example.com"
                  />
                </div>
                <div>
                  <Label className="text-neutral-300">Password</Label>
                  <Input
                    className="bg-neutral-700 border-neutral-600 text-white mt-1"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  />
                </div>
                <Button
                  className="w-full bg-secondary hover:bg-secondary-600"
                  onClick={() => create.mutate(form)}
                  disabled={create.isPending}
                >
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-neutral-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : households.length === 0 ? (
          <div className="text-center py-20 text-neutral-500">No households yet</div>
        ) : (
          <div className="space-y-3">
            {households.map((h) => (
              <Card key={h.id} className="bg-neutral-800 border-neutral-700">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary-300" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{h.name}</p>
                      <p className="text-xs text-neutral-400">
                        {h.memberCount} member{h.memberCount !== 1 ? 's' : ''} •{' '}
                        {new Date(h.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-neutral-600 text-neutral-400 text-xs">
                      #{h.id}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-neutral-500 hover:text-red-400 hover:bg-red-400/10"
                      onClick={() => {
                        if (confirm(`Delete "${h.name}"? This cannot be undone.`)) {
                          remove.mutate(h.id)
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
