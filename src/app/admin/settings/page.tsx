'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Settings } from 'lucide-react'

interface SettingsData {
  id: number
  household_id: number
  show_affirmation: boolean
  show_saint: boolean
  show_bible_passage: boolean
}

export default function AdminSettings() {
  const qc = useQueryClient()

  const { data: settings, isLoading } = useQuery<SettingsData>({
    queryKey: ['household-settings'],
    queryFn: () => fetch('/api/settings').then((r) => r.json()),
  })

  const update = useMutation({
    mutationFn: (body: Partial<SettingsData>) =>
      fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['household-settings'] })
      toast.success('Settings saved')
    },
  })

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <div className="h-48 bg-neutral-200 rounded-xl animate-pulse" />
      </div>
    )
  }

  const toggles = [
    {
      key: 'show_affirmation' as const,
      label: 'Daily Affirmation',
      description: 'Show an encouraging affirmation message in the kids view',
    },
    {
      key: 'show_saint' as const,
      label: 'Saint of the Day',
      description: 'Display the saint of the day in the kids view',
    },
    {
      key: 'show_bible_passage' as const,
      label: 'Bible Passage',
      description: 'Show a daily Bible passage or verse in the kids view',
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-neutral-500 text-sm mt-1">Customize your family's Missionly experience</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="w-4 h-4" />
            Kids View Features
          </CardTitle>
          <CardDescription>
            Choose which optional sections appear in the kids view
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {toggles.map((toggle) => (
            <div key={toggle.key} className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">{toggle.label}</Label>
                <p className="text-xs text-neutral-500 mt-0.5">{toggle.description}</p>
              </div>
              <Switch
                checked={settings?.[toggle.key] ?? true}
                onCheckedChange={(checked) =>
                  update.mutate({ [toggle.key]: checked })
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
