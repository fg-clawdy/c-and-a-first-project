import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { getRateLimitState, RATE_LIMITS } from '@/lib/rate-limit'

export async function GET() {
  try {
    const session = await requireAuth()
    const state = await getRateLimitState(session.userId)

    return NextResponse.json({
      success: true,
      data: {
        postsInMinute: state.posts_in_minute,
        postsInHour: state.posts_in_hour,
        postsInDay: state.posts_in_day,
        minuteLimit: RATE_LIMITS.perMinute,
        hourLimit: RATE_LIMITS.perHour,
        dayLimit: RATE_LIMITS.perDay
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to get rate limits' },
      { status: 500 }
    )
  }
}
