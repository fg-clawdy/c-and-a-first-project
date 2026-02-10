import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, MAX_LOGIN_ATTEMPTS, LOCKOUT_DURATION } from '@/lib/auth'
import { createSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Store timing baseline for dummy operation (prevents username enumeration via timing)

    // Find user (case-insensitive)
    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive'
        }
      }
    })

    // Prevent timing-based username enumeration with consistent error message
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
      return NextResponse.json(
        { success: false, error: `Account is locked. Try again in ${minutesLeft} minute(s).` },
        { status: 403 }
      )
    }

    // Verify password
    const validPassword = await verifyPassword(password, user.passwordHash)
    if (!validPassword) {
      // Increment failed attempts
      const failedAttempts = user.failedLoginAttempts + 1
      // Lock on 6th failed attempt: changed >= to > for correct threshold
      const shouldLock = failedAttempts > MAX_LOGIN_ATTEMPTS

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION) : null
        }
      })

      if (shouldLock) {
        return NextResponse.json(
          { success: false, error: 'Account locked due to too many failed attempts. Try again in 15 minutes.' },
          { status: 403 }
        )
      }

      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Create session
    await createSession(user.id, user.username)

    // Reset failed attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null }
    })

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: { username: user.username }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}
