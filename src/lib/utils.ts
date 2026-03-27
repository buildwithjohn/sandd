import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-NG', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function getYearLabel(year: 1 | 2) {
  return year === 1
    ? 'Year 1 — Certificate in Prophetic Ministry'
    : 'Year 2 — Diploma in NT Prophecy'
}

export function getCreditLabel(credits: number) {
  return `${credits} credit${credits !== 1 ? 's' : ''}`
}
