import type { CSSProperties } from 'react'

export type DashboardTheme = 'light' | 'dark'

export type StoreSettings = {
  homepage_layout: string[]
  announcement_active: boolean
  announcement_text: string
  announcement_link: string
  announcement_background_color: string
  store_name: string
  store_logo_url: string | null
  brand_primary_color: string
  brand_secondary_color: string
  store_header_background_color: string
  store_button_background_color: string
  store_card_background_color: string
  store_card_border_color: string
  store_cart_button_color: string
  dashboard_theme: DashboardTheme
  delivery_enabled: boolean
  pickup_enabled: boolean
  updated_at?: string | null
}

const DEFAULT_PRIMARY_COLOR = '#0f172a'
const DEFAULT_SECONDARY_COLOR = '#e2e8f0'

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  homepage_layout: ['banners', 'promotions', 'featured', 'category-nav'],
  announcement_active: false,
  announcement_text: '',
  announcement_link: '',
  announcement_background_color: '#3483fa',
  store_name: 'Improve Styles',
  store_logo_url: null,
  brand_primary_color: DEFAULT_PRIMARY_COLOR,
  brand_secondary_color: DEFAULT_SECONDARY_COLOR,
  store_header_background_color: '#ffffff',
  store_button_background_color: '#ffffff',
  store_card_background_color: '#ffffff',
  store_card_border_color: '#e2e8f0',
  store_cart_button_color: '#ffffff',
  dashboard_theme: 'light',
  delivery_enabled: true,
  pickup_enabled: true,
  updated_at: null,
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
    store_name: input?.store_name?.trim() || DEFAULT_STORE_SETTINGS.store_name,
    store_logo_url: input?.store_logo_url?.trim() || null,
    brand_primary_color: normalizeHexColor(input?.brand_primary_color, DEFAULT_PRIMARY_COLOR),
    brand_secondary_color: normalizeHexColor(input?.brand_secondary_color, DEFAULT_SECONDARY_COLOR),
    store_header_background_color: normalizeHexColor(
      input?.store_header_background_color,
      DEFAULT_STORE_SETTINGS.store_header_background_color
    ),
    store_button_background_color: normalizeHexColor(
      input?.store_button_background_color,
      DEFAULT_STORE_SETTINGS.store_button_background_color
    ),
    store_card_background_color: normalizeHexColor(
      input?.store_card_background_color,
      DEFAULT_STORE_SETTINGS.store_card_background_color
    ),
    store_card_border_color: normalizeHexColor(
      input?.store_card_border_color,
      DEFAULT_STORE_SETTINGS.store_card_border_color
    ),
    store_cart_button_color: normalizeHexColor(
      input?.store_cart_button_color,
      DEFAULT_STORE_SETTINGS.store_cart_button_color
    ),
    dashboard_theme: normalizeDashboardTheme(input?.dashboard_theme),
    delivery_enabled: input?.delivery_enabled !== undefined ? Boolean(input.delivery_enabled) : true,
    pickup_enabled: input?.pickup_enabled !== undefined ? Boolean(input.pickup_enabled) : true,
    updated_at: input?.updated_at ?? null,
  }
}

export function getContrastingTextColor(backgroundColor: string | null | undefined) {
  const normalized = (backgroundColor ?? '').replace('#', '').trim()

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

function toAlphaHex(color: string | null | undefined, alphaHex: string) {
  const normalized = (color ?? '').trim()
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? `${normalized}${alphaHex}` : color
}

export function buildStorefrontThemeStyle(
  settings: Pick<
    StoreSettings,
    | 'brand_primary_color'
    | 'brand_secondary_color'
    | 'store_header_background_color'
    | 'store_button_background_color'
    | 'store_card_background_color'
    | 'store_card_border_color'
    | 'store_cart_button_color'
  >
) {
  const primaryForeground = getContrastingTextColor(settings.brand_primary_color)
  const secondaryForeground = getContrastingTextColor(settings.brand_secondary_color)
  const headerForeground = getContrastingTextColor(settings.store_header_background_color)
  const buttonForeground = getContrastingTextColor(settings.store_button_background_color)
  const cartForeground = getContrastingTextColor(settings.store_cart_button_color)

  return {
    '--primary': settings.brand_primary_color,
    '--primary-foreground': primaryForeground,
    '--secondary': settings.brand_secondary_color,
    '--secondary-foreground': secondaryForeground,
    '--ring': settings.brand_primary_color,
    '--store-header-bg': settings.store_header_background_color,
    '--store-header-fg': headerForeground,
    '--store-header-border': toAlphaHex(headerForeground, '26'),
    '--store-header-muted': toAlphaHex(headerForeground, 'B3'),
    '--store-button-bg': settings.store_button_background_color,
    '--store-button-fg': buttonForeground,
    '--store-card-bg': settings.store_card_background_color,
    '--store-card-border': settings.store_card_border_color,
    '--store-cart-bg': settings.store_cart_button_color,
    '--store-cart-fg': cartForeground,
  } as CSSProperties
}

function hexToLinearRgb(hex: string) {
  const r = Number.parseInt(hex.slice(0, 2), 16) / 255
  const g = Number.parseInt(hex.slice(2, 4), 16) / 255
  const b = Number.parseInt(hex.slice(4, 6), 16) / 255

  const linearize = (c: number) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4

  return {
    r: linearize(r),
    g: linearize(g),
    b: linearize(b),
  }
}

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToLinearRgb(hex)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function getContrastRatio(bgHex: string, fgHex: string) {
  const bg = relativeLuminance(bgHex)
  const fg = relativeLuminance(fgHex)
  const lighter = Math.max(bg, fg)
  const darker = Math.min(bg, fg)
  return (lighter + 0.05) / (darker + 0.05)
}

export function getWcagStatus(ratio: number): 'pass' | 'pass-large' | 'fail' {
  if (ratio >= 7) return 'pass'
  if (ratio >= 4.5) return 'pass'
  if (ratio >= 3) return 'pass-large'
  return 'fail'
}

export function isMissingStoreSettingsColumnError(error: { code?: string; message: string } | null) {
  if (!error) {
    return false
  }

  return (
    error.code === 'PGRST204' ||
    error.code === 'PGRST205' ||
    error.message.includes("Could not find the table 'public.store_settings'") ||
    error.message.includes("Could not find the 'store_name' column") ||
    error.message.includes("Could not find the 'store_logo_url' column") ||
    error.message.includes("Could not find the 'brand_primary_color' column") ||
    error.message.includes("Could not find the 'brand_secondary_color' column") ||
    error.message.includes("Could not find the 'store_header_background_color' column") ||
    error.message.includes("Could not find the 'store_button_background_color' column") ||
    error.message.includes("Could not find the 'store_card_background_color' column") ||
    error.message.includes("Could not find the 'store_card_border_color' column") ||
    error.message.includes("Could not find the 'store_cart_button_color' column") ||
    error.message.includes("Could not find the 'dashboard_theme' column") ||
    error.message.includes("Could not find the 'delivery_enabled' column") ||
    error.message.includes("Could not find the 'pickup_enabled' column")
  )
}
