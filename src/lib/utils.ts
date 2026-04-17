import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTodayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function formatDollars(cents: number): string {
  if (cents === 0) return '$0'
  const dollars = cents / 100
  return dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`
}

export function dollarsToCents(dollars: string | number): number {
  return Math.round(Number(dollars) * 100)
}

export function getAge(birthdate: string | null): string {
  if (!birthdate) return ''
  const birth = new Date(birthdate)
  const now = new Date()
  const years = now.getFullYear() - birth.getFullYear()
  const months = now.getMonth() - birth.getMonth()
  const totalMonths = years * 12 + months
  const ageYears = Math.floor(totalMonths / 12)
  const ageMonths = totalMonths % 12
  if (ageMonths === 0) return `${ageYears} yrs`
  return `${ageYears}.${Math.floor((ageMonths / 12) * 10)} yrs`
}

export function getDayName(dayIndex: number): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex]
}

export function getMondayOfWeek(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export function getFirstOfMonth(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0]
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

export function addWeeks(dateStr: string, weeks: number): string {
  return addDays(dateStr, weeks * 7)
}

export function getCurrentTimeOfDay(): 'MORNING' | 'AFTERNOON' {
  const hour = new Date().getHours()
  return hour < 12 ? 'MORNING' : 'AFTERNOON'
}
