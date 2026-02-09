import bcrypt from 'bcrypt'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateSessionToken(): string {
  return crypto.randomUUID()
}

export const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
export const MAX_LOGIN_ATTEMPTS = 5
export const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes in milliseconds
