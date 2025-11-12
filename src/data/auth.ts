import { supabase } from '../../lib/supabase'
import { ApiResponse, UserRecord } from '../types'

const userSelectColumns = 'id, created_at, name, username, email, admin'

export async function loginUser(username: string, password: string): Promise<ApiResponse<UserRecord>> {
  try {
    const { data, error } = await supabase.rpc('validate_user_password', {
      p_username: username,
      p_password: password,
    })

    if (error) {
      return { data: null, error: error.message }
    }

    const users = data as UserRecord[] | null
    const user = Array.isArray(users) ? users[0] : null

    if (!user) {
      return { data: null, error: 'Invalid username or password' }
    }

    return { data: user, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unable to log in' }
  }
}

export async function fetchAuthenticatedUser(userId: number): Promise<ApiResponse<UserRecord | null>> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(userSelectColumns)
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      return { data: null, error: error.message }
    }

    if (!data) {
      return { data: null, error: null }
    }

    return { data: data as UserRecord, error: null }
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
