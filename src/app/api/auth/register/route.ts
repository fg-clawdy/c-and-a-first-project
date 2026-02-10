import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { createSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password, confirmPassword, secretQuestion, secretAnswer } = body

    // Validation
    if (!username || !email || !password || !confirmPassword || !secretQuestion || !secretAnswer) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Password validation
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json(
        { success: false, error: 'Password must contain at least one letter and one number' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    // Username uniqueness check (case-insensitive via lowercase)
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase().trim() },
          { email: email.toLowerCase().trim() }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username or email already exists' },
        { status: 409 }
      )
    }

    // Hash password and secret answer
    const passwordHash = await hashPassword(password)
    const secretAnswerHash = await hashPassword(secretAnswer.toLowerCase().trim())

    // Create user
    const user = await prisma.users.create({
      data: {
        username: username.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        secret_question: secretQuestion,
        secret_answer_hash: secretAnswerHash
      }
    })

    // Create session
    await createSession(user.id, user.username)

    // Log to console (mock email)
    console.log(`[WELCOME EMAIL] Sent to: ${email}, Username: ${username}`)

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      data: { username: user.username, email: user.email }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    )
  }
}
