'use client'

import { useState, useRef } from 'react'
import { Loader2, Camera, UserRound } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import type { AccountProfile } from '@/lib/account'

export function PersonalDataForm({ initialProfile, email }: { initialProfile: AccountProfile | null; email: string }) {
  const [profile, setProfile] = useState({
    full_name: initialProfile?.full_name || '',
    whatsapp: initialProfile?.whatsapp || '',
    photo_url: initialProfile?.photo_url || '',
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // MASCARA PARA WHATSAPP
  function handleWhatsAppChange(e: React.ChangeEvent<HTMLInputElement>) {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 11) value = value.slice(0, 11)

    if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`
    }
    if (value.length > 10) {
      value = `${value.slice(0, 10)}-${value.slice(10)}`
    }

    setProfile({ ...profile, whatsapp: value })
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setSaveMessage(null)

    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData?.user) throw new Error('Sessao expirada.')

      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${authData.user.id}/${fileName}`

      let uploadResult = await supabase.storage.from('avatars').upload(filePath, file)

      let bucketUrl = 'avatars'
      if (uploadResult.error) {
        uploadResult = await supabase.storage.from('product-images').upload(filePath, file)
        bucketUrl = 'product-images'
      }

      if (uploadResult.error) {
        throw uploadResult.error
      }

      const { data: publicUrlData } = supabase.storage.from(bucketUrl).getPublicUrl(filePath)

      const photoUrl = publicUrlData.publicUrl

      setProfile((prev) => ({ ...prev, photo_url: photoUrl }))

      // Auto save photo
      await supabase
        .from('customer_profiles')
        .update({ photo_url: photoUrl })
        .eq('id', authData.user.id)

      setSaveMessage({ type: 'success', text: 'Foto atualizada com sucesso!' })
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Nao foi possivel enviar a foto.' })
    } finally {
      setIsUploading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setSaveMessage(null)

    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) {
      setSaveMessage({ type: 'error', text: 'Sessao expirada.' })
      setIsSaving(false)
      return
    }

    const { error } = await supabase
      .from('customer_profiles')
      .update({
        full_name: profile.full_name,
        whatsapp: profile.whatsapp,
        photo_url: profile.photo_url,
      })
      .eq('id', authData.user.id)

    setIsSaving(false)

    if (error) {
      setSaveMessage({ type: 'error', text: 'Falha ao salvar dados.' })
    } else {
      setSaveMessage({ type: 'success', text: 'Dados pessoais salvos com sucesso!' })
    }
  }

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-950">Dados Pessoais</h2>
        <p className="mt-1 text-sm text-slate-500">Mantenha suas informacoes atualizadas.</p>
      </div>

      <div className="mb-10 flex items-center gap-6">
        <div className="relative group">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md">
            {profile.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.photo_url} alt="Foto de Perfil" className="h-full w-full object-cover" />
            ) : (
              <UserRound className="h-10 w-10 text-slate-400" />
            )}
            
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#3483fa] text-white shadow-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <Camera className="h-4 w-4" />
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            accept="image/*"
            className="hidden"
          />
        </div>
        
        <div>
          <h3 className="text-xl font-bold text-slate-900">{profile.full_name || 'Usuário da Loja'}</h3>
          <p className="text-sm font-medium text-slate-500">{email}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid gap-6">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">Nome completo</label>
          <input
            required
            type="text"
            value={profile.full_name}
            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
            className="h-12 w-full rounded-xl border border-slate-200 px-4 text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            placeholder="Digite seu nome completo"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">E-mail</label>
          <input
            readOnly
            type="email"
            value={email}
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-500 outline-none cursor-not-allowed"
          />
          <p className="text-xs text-slate-500">O e-mail e usado para login e nao pode ser alterado por aqui.</p>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">Telefone / WhatsApp</label>
          <input
            required
            type="tel"
            value={profile.whatsapp}
            onChange={handleWhatsAppChange}
            className="h-12 w-full rounded-xl border border-slate-200 px-4 text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            placeholder="(00) 00000-0000"
            maxLength={15}
          />
        </div>

        {saveMessage ? (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium ${saveMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {saveMessage.text}
          </div>
        ) : null}

        <div className="mt-4 border-t border-slate-100 pt-6">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#3483fa] px-8 text-sm font-bold text-white transition-colors hover:bg-[#2968c8] disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            Salvar Alteracoes
          </button>
        </div>
      </form>
    </div>
  )
}
