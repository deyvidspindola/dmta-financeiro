import type { BadgeTone } from '@/components/ui'
import type { SimulationStatus } from '@/types/models'

export const SIMULATION_STATUS_TONE: Record<SimulationStatus, BadgeTone> = {
  green: 'success',
  yellow: 'warning',
  red: 'danger',
}

export const SIMULATION_STATUS_RING: Record<SimulationStatus, string> = {
  green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  yellow: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  red: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
}
