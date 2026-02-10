import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, getSession } from '@/lib/session'
import { checkRateLimit, incrementRateLimit, formatRateLimitMessage, getRateLimitState } from '@/lib/rate-limit'

interface PostWithUser {
  id: number
  content: string
  userId: number
  createdAt: Date
  user: {
    id: number
    username: string
  }
}

// GET /api/posts - Get posts (paginated)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Require authentication
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get posts with author info
    const posts = await prisma.post.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { username: true, id: true }
        }
      }
    }) as PostWithUser[]

    const formattedPosts = posts.map((post: PostWithUser) => ({
      id: post.id,
      content: post.content,
      author: post.user.username,
      userId: post.user.id,
      createdAt: post.createdAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: { posts: formattedPosts }
    })

  } catch (error) {
    console.error('Get posts error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get posts' },
      { status: 500 }
    )
  }
}

// POST /api/posts - Create post
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const { content } = body

    // Validation
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Content must be 1000 characters or less' },
        { status: 400 }
      )
    }

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(session.userId)
    if (!rateLimitCheck.allowed) {
      const state = await getRateLimitState(session.userId)
      const message = formatRateLimitMessage(
        rateLimitCheck.limitType!,
        rateLimitCheck.resetTime!,
        state
      )
      return NextResponse.json(
        { success: false, error: message },
        { status: 429 }
      )
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        userId: session.userId,
        content
      },
      include: {
        user: {
          select: { username: true, id: true }
        }
      }
    }) as PostWithUser

    // Increment rate limit
    await incrementRateLimit(session.userId)

    const newPost = {
      id: post.id,
      content: post.content,
      author: post.user.username,
      userId: post.user.id,
      createdAt: post.createdAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      message: 'Post created',
      data: { post: newPost }
    })

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    console.error('Create post error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
