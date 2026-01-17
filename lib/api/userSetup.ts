import 'server-only'

import { createClient } from '@/lib/supabase/server'

// Helper to get authed user and supabase client
async function getClient() {
  const supabaseTyped = await createClient()
  const supabase: any = supabaseTyped
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    throw new Error('Not authenticated')
  }
  return { supabase, user: data.user }
}

function validateMargin(value: unknown) {
  if (value === undefined || value === null) return
  const num = Number(value)
  if (Number.isNaN(num) || num < 0 || num > 100) {
    throw new Error('default_profit_margin_percent must be between 0 and 100')
  }
}

function validateNonNegative(value: unknown, field: string) {
  if (value === undefined || value === null) return
  const num = Number(value)
  if (Number.isNaN(num) || num < 0) {
    throw new Error(`${field} must be >= 0`)
  }
}

function validatePositive(value: unknown, field: string) {
  if (value === undefined || value === null) return
  const num = Number(value)
  if (Number.isNaN(num) || num <= 0) {
    throw new Error(`${field} must be > 0`)
  }
}

export type ProfilePayload = {
  display_name?: string
  handle?: string
  whatsapp?: string
  city?: string
  logo_url?: string
  currency?: string
  timezone?: string
  default_profit_margin_percent?: number
  default_include_packaging?: boolean
  default_include_label?: boolean
  default_include_shipping?: boolean
  default_kwh_cost?: number
}

export async function getProfile() {
  const { supabase } = await getClient()
  const { data, error } = await supabase
    .from('user_profile')
    .select('*')
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertProfile(payload: ProfilePayload) {
  validateMargin(payload.default_profit_margin_percent)
  validateNonNegative(payload.default_kwh_cost, 'default_kwh_cost')

  const { supabase, user } = await getClient()

  const upsertPayload = {
    user_id: user.id,
    ...payload,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('user_profile')
    .upsert(upsertPayload)
    .select('*')
    .maybeSingle()

  if (error) throw error
  return data
}

export type PrinterPayload = {
  name: string
  brand?: string
  model?: string
  notes?: string
  power_watts_default?: number
  kwh_cost_override?: number | null
  machine_hour_cost_override?: number | null
  is_default?: boolean
  active?: boolean
}

export async function listPrinters() {
  const { supabase } = await getClient()
  const { data, error } = await supabase
    .from('printers')
    .select('*')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

async function clearOtherDefaults(supabase: any, userId: string) {
  const { error } = await supabase
    .from('printers')
    .update({ is_default: false })
    .eq('user_id', userId)

  if (error) throw error
}

export async function createPrinter(payload: PrinterPayload) {
  validatePositive(payload.power_watts_default ?? 200, 'power_watts_default')
  validateNonNegative(payload.kwh_cost_override, 'kwh_cost_override')
  validateNonNegative(payload.machine_hour_cost_override, 'machine_hour_cost_override')

  const { supabase, user } = await getClient()

  if (payload.is_default) {
    await clearOtherDefaults(supabase, user.id)
  }

  const { data, error } = await supabase
    .from('printers')
    .insert({
      user_id: user.id,
      ...payload,
    })
    .select('*')
    .maybeSingle()

  if (error) throw error
  return data
}

export async function updatePrinter(id: string, payload: Partial<PrinterPayload>) {
  if (payload.power_watts_default !== undefined) {
    validatePositive(payload.power_watts_default, 'power_watts_default')
  }
  validateNonNegative(payload.kwh_cost_override, 'kwh_cost_override')
  validateNonNegative(payload.machine_hour_cost_override, 'machine_hour_cost_override')

  const { supabase, user } = await getClient()

  if (payload.is_default) {
    await clearOtherDefaults(supabase, user.id)
  }

  const { data, error } = await supabase
    .from('printers')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .maybeSingle()

  if (error) throw error
  return data
}

export async function setDefaultPrinter(printerId: string) {
  const { supabase, user } = await getClient()

  await clearOtherDefaults(supabase, user.id)

  const { data, error } = await supabase
    .from('printers')
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq('id', printerId)
    .eq('user_id', user.id)
    .select('*')
    .maybeSingle()

  if (error) throw error
  return data
}

export async function togglePrinterActive(printerId: string, active: boolean) {
  const { supabase, user } = await getClient()

  const { data, error } = await supabase
    .from('printers')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', printerId)
    .eq('user_id', user.id)
    .select('*')
    .maybeSingle()

  if (error) throw error
  return data
}
