import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Junta classes NativeWind/Tailwind resolvendo conflitos (p-2 vs p-4). */
export function cn(...values: ClassValue[]): string {
  return twMerge(clsx(values));
}
