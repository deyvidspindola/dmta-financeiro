import {
  Banknote,
  BookOpen,
  Briefcase,
  Coffee,
  DollarSign,
  File,
  Gift,
  Heart,
  Home,
  RefreshCw,
  Scissors,
  Send,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Tag,
  TrendingUp,
  Truck,
  Umbrella,
  Zap,
  type LucideIcon,
} from 'lucide-react'

/**
 * Mesmo conjunto (e mesmos nomes) do seletor manual do `apps/app`
 * (`src/lib/categoryIcon.ts`, `CATEGORY_ICON_CHOICES`) — o nome salvo em
 * `Category.icon` é o mesmo texto nos dois clientes, só a renderização
 * muda (Feather lá, lucide-react aqui). `dollar-sign` já existe no
 * conjunto do app; mantido aqui também por compatibilidade.
 */
export const CATEGORY_ICON_NAMES = [
  'shopping-cart',
  'coffee',
  'home',
  'truck',
  'umbrella',
  'refresh-cw',
  'heart',
  'book-open',
  'dollar-sign',
  'trending-up',
  'shopping-bag',
  'gift',
  'smartphone',
  'zap',
  'scissors',
  'file',
  'shield',
  'send',
  'briefcase',
  'tag',
] as const

export type CategoryIconName = (typeof CATEGORY_ICON_NAMES)[number]

const ICON_COMPONENTS: Record<CategoryIconName, LucideIcon> = {
  'shopping-cart': ShoppingCart,
  coffee: Coffee,
  home: Home,
  truck: Truck,
  umbrella: Umbrella,
  'refresh-cw': RefreshCw,
  heart: Heart,
  'book-open': BookOpen,
  'dollar-sign': DollarSign,
  'trending-up': TrendingUp,
  'shopping-bag': ShoppingBag,
  gift: Gift,
  smartphone: Smartphone,
  zap: Zap,
  scissors: Scissors,
  file: File,
  shield: Shield,
  send: Send,
  briefcase: Briefcase,
  tag: Tag,
}

/** Ícone genérico pra nome fora do conjunto conhecido (categoria antiga, texto livre). */
const FALLBACK_ICON: LucideIcon = Banknote

export function categoryIconComponent(name: string | null | undefined): LucideIcon {
  if (!name) return FALLBACK_ICON
  return ICON_COMPONENTS[name as CategoryIconName] ?? FALLBACK_ICON
}
