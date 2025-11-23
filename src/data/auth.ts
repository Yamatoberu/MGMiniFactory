import type { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { ApiResponse, UserProfileRow, UserRecord } from '../types'

function mapSupabaseUser(user: User, profile: UserProfileRow | null): UserRecord | null {
  if (!user.email) {
    return null
  }

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>
  const metadataName = metadata.name ?? metadata.full_name

  return {
    id: user.id,
    email: user.email,
    profile_id: profile?.id,
    created_at: profile?.created_at ?? user.created_at ?? undefined,
    name: profile?.name ?? (typeof metadataName === 'string' ? metadataName : null),
    username: profile?.username ?? (typeof metadata.username === 'string' ? metadata.username : null),
    admin: typeof profile?.admin === 'boolean' ? profile.admin : typeof metadata.admin === 'boolean' ? metadata.admin : null,
  }
}

async function buildUserRecord(user: User | null): Promise<ApiResponse<UserRecord | null>> {
  if (!user) {
    return { data: null, error: null }
  }

  try {
    const { data: profile, error } = await supabase
      .from('users')
      .select('id, auth_user_id, created_at, name, username, admin')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (error) {
      return { data: null, error: error.message }
    }

    const mapped = mapSupabaseUser(user, (profile as UserProfileRow | null) ?? null)

    if (!mapped) {
      return { data: null, error: 'User profile is missing required information' }
    }

    return { data: mapped, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unable to load user profile' }
  }
}

export async function loginUser(email: string, password: string): Promise<ApiResponse<UserRecord>> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { data: null, error: error.message }
    }

    const result = await buildUserRecord(data.user)

    if (result.error) {
      return { data: null, error: result.error }
    }

    if (!result.data) {
      return { data: null, error: 'Unable to load user profile' }
    }

    return { data: result.data, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unable to log in' }
  }
}

export async function fetchAuthenticatedUser(): Promise<ApiResponse<UserRecord | null>> {
  try {
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      return { data: null, error: error.message }
    }

    return await buildUserRecord(data.user)
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unable to fetch user profile' }
  }
}

export async function logoutSession(): Promise<string | null> {
  try {
    await supabase.auth.signOut()
    return null
  } catch (error) {
    if (error instanceof Error) {
      return error.message
    }
    return 'Failed to end session'
  }
}
