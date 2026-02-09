import { prisma } from './prisma'

export const RATE_LIMITS = {
  perMinute: 5,
  perHour: 10,
  perDay: 20
}

interface RateLimitState {
  postsInMinute: number
  postsInHour: number
  postsInDay: number
  minuteReset: Date
  hourReset: Date
  dayReset: Date
}

export async function getRateLimitState(userId: number): Promise<RateLimitState> {
  const now = new Date()
  const minuteStart = new Date(now.getTime() - (now.getTime() % 60000))
  const hourStart = new Date(now.getTime() - (now.getTime() % 3600000))
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  // Find or create rate limit record
  let rateLimit = await prisma.rateLimit.findUnique({
    where: {
      unique_user_date: {
        userId,
        dateRecorded: today
      }
    }
  })
  
  // Create new record if doesn't exist or windows have changed
  if (!rateLimit) {
    // Clean up old records for this user first
    await prisma.rateLimit.deleteMany({
      where: { userId }
    })
    
    rateLimit = await prisma.rateLimit.create({
      data: {
        userId,
        minuteStart,
        hourStart,
        dateRecorded: today,
        postsInMinute: 0,
        postsInHour: 0,
        postsInDay: 0
      }
    })
  }
  
  // Reset counters if windows have passed
  let postsInMinute = rateLimit.postsInMinute
  let postsInHour = rateLimit.postsInHour
  
  if (rateLimit.minuteStart < minuteStart) {
    postsInMinute = 0
  }
  if (rateLimit.hourStart < hourStart) {
    postsInHour = 0
  }
  
  return {
    postsInMinute,
    postsInHour,
    postsInDay: rateLimit.postsInDay,
    minuteReset: new Date(minuteStart.getTime() + 60000),
    hourReset: new Date(hourStart.getTime() + 3600000),
    dayReset: new Date(today.getTime() + 24 * 60 * 60 * 1000)
  }
}

export async function checkRateLimit(userId: number): Promise<{ 
  allowed: boolean
  limitType?: 'minute' | 'hour' | 'day'
  resetTime?: Date
}> {
  const state = await getRateLimitState(userId)
  
  if (state.postsInMinute >= RATE_LIMITS.perMinute) {
    return { allowed: false, limitType: 'minute', resetTime: state.minuteReset }
  }
  
  if (state.postsInHour >= RATE_LIMITS.perHour) {
    return { allowed: false, limitType: 'hour', resetTime: state.hourReset }
  }
  
  if (state.postsInDay >= RATE_LIMITS.perDay) {
    return { allowed: false, limitType: 'day', resetTime: state.dayReset }
  }
  
  return { allowed: true }
}

export async function incrementRateLimit(userId: number): Promise<void> {
  const now = new Date()
  const minuteStart = new Date(now.getTime() - (now.getTime() % 60000))
  const hourStart = new Date(now.getTime() - (now.getTime() % 3600000))
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  const existing = await prisma.rateLimit.findUnique({
    where: {
      unique_user_date: {
        userId,
        dateRecorded: today
      }
    }
  })
  
  if (!existing) {
    await prisma.rateLimit.create({
      data: {
        userId,
        minuteStart,
        hourStart,
        dateRecorded: today,
        postsInMinute: 1,
        postsInHour: 1,
        postsInDay: 1
      }
    })
    return
  }
  
  const updates: Record<string, Date | number> = {
    postsInMinute: existing.postsInMinute + 1,
    postsInHour: existing.postsInHour + 1,
    postsInDay: existing.postsInDay + 1
  }
  
  if (existing.minuteStart < minuteStart) {
    updates.minuteStart = minuteStart
    updates.postsInMinute = 1
  }
  
  if (existing.hourStart < hourStart) {
    updates.hourStart = hourStart
    updates.postsInHour = 1
  }
  
  await prisma.rateLimit.update({
    where: { id: existing.id },
    data: updates
  })
}

export function formatRateLimitMessage(
  limitType: 'minute' | 'hour' | 'day', 
  resetTime: Date, 
  state: RateLimitState
): string {
  const now = new Date()
  const minutesUntilReset = Math.ceil((resetTime.getTime() - now.getTime()) / 60000)
  
  const messages = {
    minute: `Rate limit exceeded: ${state.postsInMinute}/${RATE_LIMITS.perMinute} posts per minute. Try again in ${minutesUntilReset} minute${minutesUntilReset > 1 ? 's' : ''}.`,
    hour: `Rate limit exceeded: ${state.postsInHour}/${RATE_LIMITS.perHour} posts per hour. Try again in ${Math.ceil(minutesUntilReset / 60)} hour${Math.ceil(minutesUntilReset / 60) > 1 ? 's' : ''}.`,
    day: `Rate limit exceeded: ${state.postsInDay}/${RATE_LIMITS.perDay} posts per day. Try again tomorrow.`
  }
  
  return messages[limitType]
}
