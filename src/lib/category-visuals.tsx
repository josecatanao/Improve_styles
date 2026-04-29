import type { LucideIcon } from 'lucide-react'
import {
  Briefcase,
  CircleDollarSign,
  Footprints,
  Gem,
  Glasses,
  Grid2X2,
  Handbag,
  HatGlasses,
  Package2,
  Shirt,
  ShoppingBag,
  Sparkles,
  UserRound,
  Wallet,
  Watch,
} from 'lucide-react'
import type { SVGProps } from 'react'

function ShortsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 4h10l1 7-4 2-2-3-2 3-4-2 1-7Z" />
      <path d="M8 11l1 9h4V10" />
      <path d="M16 11l-1 9h-4" />
    </svg>
  )
}

export const CATEGORY_ICON_OPTIONS = [
  { name: 'shirt', label: 'Camisa', icon: Shirt },
  { name: 'shorts', label: 'Short / Bermuda', icon: ShortsIcon as LucideIcon },
  { name: 'handbag', label: 'Bolsa', icon: Handbag },
  { name: 'footprints', label: 'Sapato', icon: Footprints },
  { name: 'wallet', label: 'Cinto / Carteira', icon: Wallet },
  { name: 'watch', label: 'Relogio', icon: Watch },
  { name: 'glasses', label: 'Oculos', icon: Glasses },
  { name: 'hat-glasses', label: 'Bone / Chapeu', icon: HatGlasses },
  { name: 'gem', label: 'Joias', icon: Gem },
  { name: 'shopping-bag', label: 'Sacola', icon: ShoppingBag },
  { name: 'circle-dollar-sign', label: 'Promocao', icon: CircleDollarSign },
  { name: 'sparkles', label: 'Destaque', icon: Sparkles },
  { name: 'briefcase', label: 'Trabalho', icon: Briefcase },
  { name: 'user-round', label: 'Pessoa', icon: UserRound },
  { name: 'grid', label: 'Grade', icon: Grid2X2 },
  { name: 'package', label: 'Pacote', icon: Package2 },
] as const

export type CategoryIconName = (typeof CATEGORY_ICON_OPTIONS)[number]['name']

export function resolveCategoryIcon(iconName?: string | null): LucideIcon {
  return CATEGORY_ICON_OPTIONS.find((item) => item.name === iconName)?.icon ?? Grid2X2
}
