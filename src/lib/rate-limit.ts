import { prisma } from './prisma'

export const RATE_LIMITS = {
  perMinute: 5,
  perHour: 10,
  perDay: 20
}

interface RateLimitState {
  posts_in_minute: number
  posts_in_hour: number
  posts_in_day: number
  minute_reset: Date
  hour_reset: Date
  day_reset: Date
}

export async function getRateLimitState(userId: number): Promise<RateLimitState> {
  const now = new Date()
  const minuteStart = new Date(now.getTime() - (now.getTime() % 60000))
  const hourStart = new Date(now.getTime() - (now.getTime() % 3600000))
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Find or create rate limit record
  let rateLimit = await prisma.rate_limits.findUnique({
    where: {
      unique_user_date: {
        user_id: userId,
        date_recorded: today
      }
    }
  })

  // Create new record if doesn't exist or windows have changed
  if (!rateLimit) {
    // Clean up old records for this user first
    await prisma.rate_limits.deleteMany({
      where: { user_id: userId }
    })
    rateLimit = await prisma.rate_limits.create({
      data: {
        user_id: userId,
        minute_start: minuteStart,
        hour_start: hourStart,
        date_recorded: today,
        posts_in_minute: 0,
        posts_in_hour: 0,
        posts_in_day: 0
      }
    })
  }

  // Reset counters if windows have passed
  let postsInMinute = rateLimit.posts_in_minute
  let postsInHour = rateLimit.posts_in_hour

  if (rateLimit.minute_start < minuteStart) {
    postsInMinute = 0
  }
  if (rateLimit.hour_start < hourStart) {
    postsInHour = 0
  }

  return {
    posts_in_minute: postsInMinute,
    posts_in_hour: postsInHour,
    posts_in_day: rateLimit.posts_in_day,
    minute_reset: new Date(minuteStart.getTime() + 60000),
    hour_reset: new Date(hourStart.getTime() + 3600000),
    day_reset: new Date(today.getTime() + 24 * 60 * 60 * 1000)
  }
}

interface RateLimitCheck {
  allowed: boolean
  limitType?: 'minute' | 'hour' | 'day'
  resetTime?: Date
}

export async function checkRateLimit(userId: number): Promise<RateLimitCheck> {
  const state = await getRateLimitState(userId)

  // Check minute limit
  if (state.posts_in_minute >= RATE_LIMITS.perMinute) {
    return {
      allowed: false,
      limitType: 'minute',
      resetTime: state.minute_reset
    }
  }

  // Check hour limit
  if (state.posts_in_hour >= RATE_LIMITS.perHour) {
    return {
      allowed: false,
      limitType: 'hour',
      resetTime: state.hour_reset
    }
  }

  // Check day limit
  if (state.posts_in_day >= RATE_LIMITS.perDay) {
    return {
      allowed: false,
      limitType: 'day',
      resetTime: state.day_reset
    }
  }

  return { allowed: true }
}

export async function incrementRateLimit(userId: number): Promise<void> {
  const now = new Date()
  const minuteStart = new Date(now.getTime() - (now.getTime() % 60000))
  const hourStart = new Date(now.getTime() - (now.getTime() % 3600000))
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const existing = await prisma.rate_limits.findUnique({
    where: {
      unique_user_date: {
        user_id: userId,
        date_recorded: today
      }
    }
  })

  if (!existing) {
    await prisma.rate_limits.create({
      data: {
        user_id: userId,
        minute_start: minuteStart,
        hour_start: hourStart,
        date_recorded: today,
        posts_in_minute: 1,
        posts_in_hour: 1,
        posts_in_day: 1
      }
    })
  } else {
    // Determine which counters to reset
    const resetMinute = existing.minute_start < minuteStart
    const resetHour = existing.hour_start < hourStart

    await prisma.rate_limits.update({
      where: {
        unique_user_date: {
          user_id: userId,
          date_recorded: today
        }
      },
      data: {
        posts_in_minute: resetMinute ? 1 : { increment: 1 },
        posts_in_hour: resetHour ? 1 : { increment: 1 },
        posts_in_day: { increment: 1 },
        ...(resetMinute && { minute_start: minuteStart }),
        ...(resetHour && { hour_start: hourStart })
      }
    })
  }
}

export function formatRateLimitMessage(
  limitType: 'minute' | 'hour' | 'day',
  resetTime: Date,
  state: RateLimitState
): string {
  const waitMinutes = Math.ceil((resetTime.getTime() - Date.now()) / 60000)

  switch (limitType) {
    case 'minute':
      return `Rate limit exceeded. You can post ${RATE_LIMITS.perMinute} times per minute. Please wait ${waitMinutes} minute(s).`
    case 'hour':
      return `Rate limit exceeded. You can post ${RATE_LIMITS.perHour} times per hour. Please wait ${waitMinutes} minute(s).`
    case 'day':
      return `Rate limit exceeded. You can post ${RATE_LIMITS.perDay} times per day. Please try again tomorrow.`
    default:
      return 'Rate limit exceeded. Please try again later.'
  }
}
