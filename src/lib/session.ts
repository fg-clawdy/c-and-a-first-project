import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { SESSION_DURATION } from './auth'

export interface Session {
  userId: number
  username: string
}

export async function createSession(userId: number, username: string): Promise<string> {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_DURATION)
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      lastLoginAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null
    }
  })
  
  const cookieStore = await cookies()
  cookieStore.set('session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: expiresAt,
    path: '/'
  })
  
  cookieStore.set('user_id', userId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: expiresAt,
    path: '/'
  })
  
  cookieStore.set('username', username, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: expiresAt,
    path: '/'
  })
  
  return token
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const userId = cookieStore.get('user_id')?.value
  const username = cookieStore.get('username')?.value
  
  if (!userId || !username) {
    return null
  }
  
  return {
    userId: parseInt(userId),
    username
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('session_token')
  cookieStore.delete('user_id')
  cookieStore.delete('username')
}

export async function requireAuth(): Promise<Session> {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}
