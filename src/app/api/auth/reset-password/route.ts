import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, hashPassword } from '@/lib/auth'

// Step 1: Get secret question for username
export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get('username')
    
    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      )
    }

    const user = await prisma.users.findFirst({
      where: {
        username: username.toLowerCase().trim()
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { secretQuestion: user.secret_question }
    })

  } catch (error) {
    console.error('Get secret question error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get secret question' },
      { status: 500 }
    )
  }
}

// Step 2: Verify secret answer and reset password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, secretAnswer, newPassword, confirmNewPassword } = body

    if (!username || !secretAnswer || !newPassword || !confirmNewPassword) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Password validation
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { success: false, error: 'Password must contain at least one letter and one number' },
        { status: 400 }
      )
    }

    if (newPassword !== confirmNewPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.users.findFirst({
      where: {
        username: username.toLowerCase().trim()
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify secret answer
    const validAnswer = await verifyPassword(
      secretAnswer.toLowerCase().trim(),
      user.secret_answer_hash
    )

    if (!validAnswer) {
      return NextResponse.json(
        { success: false, error: 'Incorrect secret answer' },
        { status: 401 }
      )
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update password and reset lock status
    await prisma.users.update({
      where: { id: user.id },
      data: {
        password_hash: newPasswordHash,
        failed_login_attempts: 0,
        locked_until: null
      }
    })

    // Log confirmation (mock email)
    console.log(`[PASSWORD RESET CONFIRMATION] Sent to: ${user.email}, Username: ${user.username}`)

    return NextResponse.json({
      success: true,
      message: 'Password reset successful. Please log in with your new password.'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
