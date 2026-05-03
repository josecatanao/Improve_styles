'use server'

import { createClient } from '@/utils/supabase/server'
import type { CustomerAddress, CustomerAddressInput } from '@/lib/customer-addresses-shared'

function buildAddressFromProfile(profile: Record<string, unknown>, userId: string): CustomerAddress {
  return {
    id: userId,
    customer_id: userId,
    label: null,
    street: String(profile.delivery_address ?? ''),
    number: String(profile.delivery_house_number ?? '') || null,
    complement: String(profile.delivery_complement ?? '') || null,
    neighborhood: String(profile.delivery_neighborhood ?? '') || null,
    city: String(profile.delivery_city ?? '') || null,
    state: String(profile.delivery_state ?? '') || null,
    zip_code: String(profile.delivery_zip_code ?? '') || null,
    reference: String(profile.delivery_reference ?? '') || null,
    latitude: profile.delivery_lat != null ? Number(profile.delivery_lat) : null,
    longitude: profile.delivery_lng != null ? Number(profile.delivery_lng) : null,
    gps_captured_at: String(profile.delivery_gps_captured_at ?? '') || null,
    is_primary: true,
    created_at: String(profile.created_at ?? new Date().toISOString()),
    updated_at: String(profile.updated_at ?? new Date().toISOString()),
  }
}

export async function getCustomerAddresses(userId: string): Promise<CustomerAddress[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', userId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      if (error.code === '42P01') {
        const { data: profile } = await supabase
          .from('customer_profiles')
          .select('delivery_address, delivery_house_number, delivery_complement, delivery_neighborhood, delivery_zip_code, delivery_city, delivery_state, delivery_reference, delivery_lat, delivery_lng, delivery_gps_captured_at, created_at, updated_at')
          .eq('id', userId)
          .single()

        if (profile) {
          const addr = buildAddressFromProfile(profile, userId)
          const hasContent = addr.street || addr.zip_code || addr.city
          return hasContent ? [addr] : []
        }
        return []
      }
      console.error('[getCustomerAddresses]', error.message)
      return []
    }

    return (data ?? []) as CustomerAddress[]
  } catch (err) {
    console.error('[getCustomerAddresses]', err instanceof Error ? err.message : err)
    return []
  }
}

export async function createCustomerAddress(
  userId: string,
  input: CustomerAddressInput
): Promise<{ success: boolean; address?: CustomerAddress; error?: string }> {
  try {
    const supabase = await createClient()

    const payload = {
      customer_id: userId,
      label: input.label?.trim() || null,
      street: input.street.trim(),
      number: input.number?.trim() || null,
      complement: input.complement?.trim() || null,
      neighborhood: input.neighborhood?.trim() || null,
      city: input.city?.trim() || null,
      state: input.state?.trim() || null,
      zip_code: input.zip_code?.trim() || null,
      reference: input.reference?.trim() || null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      gps_captured_at: input.gps_captured_at ?? null,
    }

    if (input.is_primary) {
      const { error: unsetError } = await supabase
        .from('customer_addresses')
        .update({ is_primary: false })
        .eq('customer_id', userId)

      if (unsetError && unsetError.code === '42P01') {
        await supabase
          .from('customer_profiles')
          .update({
            delivery_address: payload.street,
            delivery_house_number: payload.number,
            delivery_complement: payload.complement,
            delivery_neighborhood: payload.neighborhood,
            delivery_zip_code: payload.zip_code,
            delivery_city: payload.city,
            delivery_state: payload.state,
            delivery_reference: payload.reference,
            delivery_lat: payload.latitude,
            delivery_lng: payload.longitude,
            delivery_gps_captured_at: payload.gps_captured_at,
          })
          .eq('id', userId)

        const built = buildAddressFromProfile({
          delivery_address: payload.street,
          delivery_house_number: payload.number,
          delivery_complement: payload.complement,
          delivery_neighborhood: payload.neighborhood,
          delivery_zip_code: payload.zip_code,
          delivery_city: payload.city,
          delivery_state: payload.state,
          delivery_reference: payload.reference,
          delivery_lat: payload.latitude,
          delivery_lng: payload.longitude,
          delivery_gps_captured_at: payload.gps_captured_at,
        }, userId)

        return { success: true, address: built }
      }
    }

    const { data, error } = await supabase
      .from('customer_addresses')
      .insert({ ...payload, is_primary: input.is_primary ?? false })
      .select('*')
      .single()

    if (error) {
      if (error.code === '42P01') {
        await supabase
          .from('customer_profiles')
          .update({
            delivery_address: payload.street,
            delivery_house_number: payload.number,
            delivery_complement: payload.complement,
            delivery_neighborhood: payload.neighborhood,
            delivery_zip_code: payload.zip_code,
            delivery_city: payload.city,
            delivery_state: payload.state,
            delivery_reference: payload.reference,
            delivery_lat: payload.latitude,
            delivery_lng: payload.longitude,
            delivery_gps_captured_at: payload.gps_captured_at,
          })
          .eq('id', userId)

        const built = buildAddressFromProfile({
          delivery_address: payload.street,
          delivery_house_number: payload.number,
          delivery_complement: payload.complement,
          delivery_neighborhood: payload.neighborhood,
          delivery_zip_code: payload.zip_code,
          delivery_city: payload.city,
          delivery_state: payload.state,
          delivery_reference: payload.reference,
          delivery_lat: payload.latitude,
          delivery_lng: payload.longitude,
          delivery_gps_captured_at: payload.gps_captured_at,
        }, userId)

        return { success: true, address: built }
      }
      return { success: false, error: error.message }
    }

    return { success: true, address: data as CustomerAddress }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro ao criar endereço' }
  }
}

export async function updateCustomerAddress(
  addressId: string,
  userId: string,
  input: Partial<CustomerAddressInput>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const updateData: Record<string, unknown> = {}
    if (input.label !== undefined) updateData.label = input.label?.trim() || null
    if (input.street !== undefined) updateData.street = input.street.trim()
    if (input.number !== undefined) updateData.number = input.number?.trim() || null
    if (input.complement !== undefined) updateData.complement = input.complement?.trim() || null
    if (input.neighborhood !== undefined) updateData.neighborhood = input.neighborhood?.trim() || null
    if (input.city !== undefined) updateData.city = input.city?.trim() || null
    if (input.state !== undefined) updateData.state = input.state?.trim() || null
    if (input.zip_code !== undefined) updateData.zip_code = input.zip_code?.trim() || null
    if (input.reference !== undefined) updateData.reference = input.reference?.trim() || null
    if (input.latitude !== undefined) updateData.latitude = input.latitude ?? null
    if (input.longitude !== undefined) updateData.longitude = input.longitude ?? null
    if (input.gps_captured_at !== undefined) updateData.gps_captured_at = input.gps_captured_at ?? null

    if (input.is_primary) {
      await supabase
        .from('customer_addresses')
        .update({ is_primary: false })
        .eq('customer_id', userId)
        .neq('id', addressId)
    }

    if (input.is_primary !== undefined) {
      updateData.is_primary = input.is_primary
    }

    const { error: updateErr } = await supabase
      .from('customer_addresses')
      .update(updateData)
      .eq('id', addressId)
      .eq('customer_id', userId)

    if (updateErr) {
      if (updateErr.code === '42P01') {
        const profileUpdate: Record<string, unknown> = {}
        if (input.street !== undefined) profileUpdate.delivery_address = input.street.trim()
        if (input.number !== undefined) profileUpdate.delivery_house_number = input.number?.trim() || null
        if (input.complement !== undefined) profileUpdate.delivery_complement = input.complement?.trim() || null
        if (input.neighborhood !== undefined) profileUpdate.delivery_neighborhood = input.neighborhood?.trim() || null
        if (input.city !== undefined) profileUpdate.delivery_city = input.city?.trim() || null
        if (input.state !== undefined) profileUpdate.delivery_state = input.state?.trim() || null
        if (input.zip_code !== undefined) profileUpdate.delivery_zip_code = input.zip_code?.trim() || null
        if (input.reference !== undefined) profileUpdate.delivery_reference = input.reference?.trim() || null
        if (input.latitude !== undefined) profileUpdate.delivery_lat = input.latitude ?? null
        if (input.longitude !== undefined) profileUpdate.delivery_lng = input.longitude ?? null
        if (input.gps_captured_at !== undefined) profileUpdate.delivery_gps_captured_at = input.gps_captured_at ?? null

        if (Object.keys(profileUpdate).length > 0) {
          await supabase
            .from('customer_profiles')
            .update(profileUpdate)
            .eq('id', userId)
        }
        return { success: true }
      }
      return { success: false, error: updateErr.message }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro ao atualizar endereço' }
  }
}

export async function deleteCustomerAddress(
  addressId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: target, error: selectError } = await supabase
      .from('customer_addresses')
      .select('is_primary')
      .eq('id', addressId)
      .eq('customer_id', userId)
      .single()

    if (selectError) {
      if (selectError.code === '42P01') {
        await supabase
          .from('customer_profiles')
          .update({
            delivery_address: null,
            delivery_house_number: null,
            delivery_complement: null,
            delivery_neighborhood: null,
            delivery_zip_code: null,
            delivery_city: null,
            delivery_state: null,
            delivery_reference: null,
            delivery_lat: null,
            delivery_lng: null,
            delivery_gps_captured_at: null,
          })
          .eq('id', userId)
        return { success: true }
      }
      return { success: false, error: selectError.message }
    }

    const wasPrimary = target?.is_primary === true

    const { error: deleteError } = await supabase
      .from('customer_addresses')
      .delete()
      .eq('id', addressId)
      .eq('customer_id', userId)

    if (deleteError) {
      if (deleteError.code === '42P01') {
        await supabase
          .from('customer_profiles')
          .update({
            delivery_address: null,
            delivery_house_number: null,
            delivery_complement: null,
            delivery_neighborhood: null,
            delivery_zip_code: null,
            delivery_city: null,
            delivery_state: null,
            delivery_reference: null,
            delivery_lat: null,
            delivery_lng: null,
            delivery_gps_captured_at: null,
          })
          .eq('id', userId)
        return { success: true }
      }
      return { success: false, error: deleteError.message }
    }

    if (wasPrimary) {
      const { data: remaining } = await supabase
        .from('customer_addresses')
        .select('id')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (remaining) {
        await supabase
          .from('customer_addresses')
          .update({ is_primary: true })
          .eq('id', remaining.id)
          .eq('customer_id', userId)
      }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro ao excluir endereço' }
  }
}

export async function setPrimaryAddress(
  addressId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  return updateCustomerAddress(addressId, userId, { is_primary: true })
}
