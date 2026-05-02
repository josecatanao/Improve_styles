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

  const email = (formData.get('email') as string)?.trim()
  const password = (formData.get('password') as string)?.trim()

  if (!email || !password) {
    return redirect(buildLoginRedirect(nextPath, 'Preencha email e senha.', authView, mode))
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return redirect(buildLoginRedirect(nextPath, error.message, authView, mode))
  }

  if (authData.user && mode === 'customer') {
    try {
      await ensureCustomerProfile(supabase, authData.user)

      const { error: profileUpdateError } = await supabase
        .from('customer_profiles')
        .update({
          email: authData.user.email ?? email,
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

  const email = (formData.get('email') as string)?.trim()
  const password = (formData.get('password') as string)?.trim()

  if (!email || !password) {
    return redirect(buildLoginRedirect(nextPath, 'Preencha email e senha.', authView, mode))
  }

  if (password.length < 6) {
    return redirect(buildLoginRedirect(nextPath, 'A senha deve ter pelo menos 6 caracteres.', authView, mode))
  }

  const confirmPassword = String(formData.get('confirmPassword') || '').trim()

  if (accountType === 'customer' && confirmPassword !== password) {
    return redirect(buildLoginRedirect(nextPath, 'As senhas nao coincidem.', authView, mode))
  }

  const fullName = String(formData.get('fullName') || '').trim()
  const rawWhatsapp = String(formData.get('whatsapp') || '')
  const whatsapp = rawWhatsapp.replace(/\D/g, '')
  const deliveryAddress = String(formData.get('deliveryAddress') || '').trim()
  const photoUrl = String(formData.get('photoUrl') || '').trim()

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
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
      email: authData.user.email ?? email,
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

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient()
  const email = (formData.get('email') as string)?.trim()

  if (!email) {
    return redirect(
      `/login?error=true&message=${encodeURIComponent('Informe seu email para recuperar a senha.')}&view=login`
    )
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login/update-password`,
  })

  if (error) {
    return redirect(`/login?error=true&message=${encodeURIComponent(error.message)}&view=login`)
  }

  return redirect(
    `/login?success=true&message=${encodeURIComponent('Email de recuperacao enviado. Verifique sua caixa de entrada.')}&view=login`
  )
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = (formData.get('password') as string)?.trim()

  if (!password || password.length < 6) {
    return redirect('/login/update-password?error=true&message=A senha deve ter pelo menos 6 caracteres.')
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return redirect(`/login/update-password?error=true&message=${encodeURIComponent(error.message)}`)
  }

  return redirect('/login?success=true&message=Senha atualizada com sucesso. Faca login.&view=login')
}
