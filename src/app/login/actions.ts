'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ensureCustomerProfile } from '@/lib/customer-profile'
import { createClient } from '@/utils/supabase/server'

function sanitizeMode(value: FormDataEntryValue | null) {
  return value === 'customer' ? 'customer' : 'admin'
}

function getDefaultNextPath(mode: 'customer' | 'admin') {
  return mode === 'customer' ? '/' : '/dashboard'
}

function sanitizeNextPath(value: FormDataEntryValue | null, mode: 'customer' | 'admin') {
  const defaultPath = getDefaultNextPath(mode)
  const nextPath = String(value || defaultPath)
  return nextPath.startsWith('/') ? nextPath : defaultPath
}

function sanitizeAuthView(value: FormDataEntryValue | null) {
  return value === 'signup' ? 'signup' : 'login'
}

function buildLoginRedirect(nextPath: string, message: string, view: 'login' | 'signup', mode: 'customer' | 'admin') {
  const params = new URLSearchParams({
    error: 'true',
    message,
    next: nextPath,
    view,
  })

  if (mode === 'customer') {
    params.set('mode', 'customer')
  }

  return `/login?${params.toString()}`
}

export async function login(formData: FormData) {
  const supabase = await createClient()
  const mode = sanitizeMode(formData.get('mode'))
  const nextPath = sanitizeNextPath(formData.get('next'), mode)
  const authView = sanitizeAuthView(formData.get('authView'))

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return redirect(buildLoginRedirect(nextPath, error.message, authView, mode))
  }

  if (authData.user && mode === 'customer') {
    try {
      await ensureCustomerProfile(supabase, authData.user)

      const { error: profileUpdateError } = await supabase
        .from('customer_profiles')
        .update({
          email: authData.user.email ?? data.email,
          status: 'active',
          full_name: String(authData.user.user_metadata.full_name || 'Cliente'),
          last_login_at: new Date().toISOString(),
        })
        .eq('id', authData.user.id)

      if (profileUpdateError) {
        return redirect(buildLoginRedirect(nextPath, profileUpdateError.message, authView, mode))
      }
    } catch (profileError) {
      return redirect(
        buildLoginRedirect(
          nextPath,
          profileError instanceof Error ? profileError.message : 'Nao foi possivel preparar o perfil do cliente.',
          authView,
          mode
        )
      )
    }
  }

  revalidatePath('/', 'layout')
  redirect(nextPath)
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const mode = sanitizeMode(formData.get('mode'))
  const nextPath = sanitizeNextPath(formData.get('next'), mode)
  const authView = sanitizeAuthView(formData.get('authView'))
  const accountType = mode === 'customer' ? 'customer' : 'admin'

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const fullName = String(formData.get('fullName') || '').trim()
  const whatsapp = String(formData.get('whatsapp') || '').trim()
  const deliveryAddress = String(formData.get('deliveryAddress') || '').trim()
  const photoUrl = String(formData.get('photoUrl') || '').trim()

  const { data: authData, error } = await supabase.auth.signUp({
    ...data,
    options: {
      data: {
        account_type: accountType,
        full_name: fullName || null,
      },
    },
  })

  if (error) {
    return redirect(buildLoginRedirect(nextPath, error.message, authView, mode))
  }

  if (accountType === 'customer' && authData.user) {
    const payload = {
      id: authData.user.id,
      email: authData.user.email ?? data.email,
      full_name: fullName || 'Cliente',
      whatsapp: whatsapp || null,
      photo_url: photoUrl || null,
      delivery_address: deliveryAddress || null,
      status: 'active',
      last_login_at: null,
    }

    const { error: profileError } = await supabase.from('customer_profiles').upsert(payload)

    if (profileError) {
      return redirect(buildLoginRedirect(nextPath, profileError.message, authView, mode))
    }
  }

  revalidatePath('/', 'layout')
  redirect(nextPath)
}

export async function logout(formData: FormData) {
  const supabase = await createClient()
  const nextPath = sanitizeNextPath(formData.get('next'), sanitizeMode(formData.get('mode')))
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect(nextPath)
}
