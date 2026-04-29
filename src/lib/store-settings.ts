import type { CSSProperties } from 'react'

export type DashboardTheme = 'light' | 'dark'

export type StoreSettings = {
  homepage_layout: string[]
  announcement_active: boolean
  announcement_text: string
  announcement_link: string
  announcement_background_color: string
  store_logo_url: string | null
  brand_primary_color: string
  brand_secondary_color: string
  dashboard_theme: DashboardTheme
}

const DEFAULT_PRIMARY_COLOR = '#0f172a'
const DEFAULT_SECONDARY_COLOR = '#e2e8f0'

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  homepage_layout: ['banners', 'promotions', 'featured', 'category-nav'],
  announcement_active: false,
  announcement_text: '',
  announcement_link: '',
  announcement_background_color: '#3483fa',
  store_logo_url: null,
  brand_primary_color: DEFAULT_PRIMARY_COLOR,
  brand_secondary_color: DEFAULT_SECONDARY_COLOR,
  dashboard_theme: 'light',
}

type StoreSettingsInput = Partial<StoreSettings> | null | undefined

export function normalizeHexColor(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim() ?? ''
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized : fallback
}

export function normalizeDashboardTheme(value: string | null | undefined): DashboardTheme {
  return value === 'dark' ? 'dark' : 'light'
}

export function normalizeStoreSettings(input: StoreSettingsInput): StoreSettings {
  return {
    homepage_layout:
      input?.homepage_layout?.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) ??
      DEFAULT_STORE_SETTINGS.homepage_layout,
    announcement_active: Boolean(input?.announcement_active),
    announcement_text: input?.announcement_text?.trim() ?? '',
    announcement_link: input?.announcement_link?.trim() ?? '',
    announcement_background_color: normalizeHexColor(
      input?.announcement_background_color,
      DEFAULT_STORE_SETTINGS.announcement_background_color
    ),
    store_logo_url: input?.store_logo_url?.trim() || null,
    brand_primary_color: normalizeHexColor(input?.brand_primary_color, DEFAULT_PRIMARY_COLOR),
    brand_secondary_color: normalizeHexColor(input?.brand_secondary_color, DEFAULT_SECONDARY_COLOR),
    dashboard_theme: normalizeDashboardTheme(input?.dashboard_theme),
  }
}

export function getContrastingTextColor(backgroundColor: string) {
  const normalized = backgroundColor.replace('#', '').trim()

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return '#ffffff'
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000

  return luminance > 160 ? '#0f172a' : '#ffffff'
}

export function buildStoreBrandStyle(settings: Pick<StoreSettings, 'brand_primary_color' | 'brand_secondary_color'>) {
  const primaryForeground = getContrastingTextColor(settings.brand_primary_color)
  const secondaryForeground = getContrastingTextColor(settings.brand_secondary_color)

  return {
    '--primary': settings.brand_primary_color,
    '--primary-foreground': primaryForeground,
    '--secondary': settings.brand_secondary_color,
    '--secondary-foreground': secondaryForeground,
    '--ring': settings.brand_primary_color,
  } as CSSProperties
}

export function isMissingStoreSettingsColumnError(error: { code?: string; message: string } | null) {
  if (!error) {
    return false
  }

  return (
    error.code === 'PGRST204' ||
    error.code === 'PGRST205' ||
    error.message.includes("Could not find the table 'public.store_settings'") ||
    error.message.includes("Could not find the 'store_logo_url' column") ||
    error.message.includes("Could not find the 'brand_primary_color' column") ||
    error.message.includes("Could not find the 'brand_secondary_color' column") ||
    error.message.includes("Could not find the 'dashboard_theme' column")
  )
}
