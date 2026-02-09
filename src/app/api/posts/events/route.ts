import { NextRequest } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await getSession()
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'))
      
      // Keep track of last check time
      let lastCheck = new Date()
      
      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(':heartbeat\n\n'))
      }, 30000)
      
      // Check for new posts every 2 seconds
      const checkInterval = setInterval(async () => {
        try {
          const newPosts = await prisma.post.findMany({
            where: {
              createdAt: { gt: lastCheck }
            },
            include: {
              user: { select: { username: true } }
            },
            orderBy: { createdAt: 'asc' }
          })
          
          if (newPosts.length > 0) {
            lastCheck = new Date()
            for (const post of newPosts) {
              const data = {
                type: 'new_post',
                post: {
                  id: post.id,
                  content: post.content,
                  author: post.user.username,
                  createdAt: post.createdAt.toISOString()
                }
              }
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
            }
          }
        } catch (error) {
          console.error('SSE check error:', error)
        }
      }, 2000)
      
      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        clearInterval(checkInterval)
        controller.close()
      })
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
