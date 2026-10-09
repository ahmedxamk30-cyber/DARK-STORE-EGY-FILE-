import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import type { Profile, Role } from './types';

export const STAFF_ROLES: Role[] = ['support', 'admin', 'super_admin'];
export const ADMIN_ROLES: Role[] = ['admin', 'super_admin'];

export type Session = {
  user: { id: string; email: string | undefined };
  profile: Profile;
};

// Verifies the session with Supabase and loads the role from the database.
export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, balance_cents, created_at')
    .eq('id', auth.user.id)
    .single();

  if (!profile) return null;
  return { user: { id: auth.user.id, email: auth.user.email }, profile: profile as Profile };
}

// For server actions: returns a client plus the verified session, or null.
export async function getActionContext() {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, balance_cents, created_at')
    .eq('id', auth.user.id)
    .single();
  if (!profile) return null;
  return { supabase, userId: auth.user.id, role: (profile as Profile).role };
}
