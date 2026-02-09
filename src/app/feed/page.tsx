'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PostCard } from '@/components/posts/PostCard'
import { PostCreator } from '@/components/posts/PostCreator'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { useAuth } from '@/components/auth/AuthProvider'

interface Post {
  id: number
  content: string
  author: string
  userId: number
  createdAt: string
}

interface RateLimits {
  postsInMinute: number
  postsInHour: number
  postsInDay: number
  minuteLimit: number
  hourLimit: number
  dayLimit: number
}

const DEFAULT_LIMITS: RateLimits = {
  postsInMinute: 0,
  postsInHour: 0,
  postsInDay: 0,
  minuteLimit: 5,
  hourLimit: 10,
  dayLimit: 20
}

export default function FeedPage() {
  const router = useRouter()
  const { user, logout, isLoading: authLoading, isAuthenticated } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [rateLimits, setRateLimits] = useState<RateLimits>(DEFAULT_LIMITS)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchPosts = useCallback(async (pageNum: number) => {
    try {
      const res = await fetch(`/api/posts?page=${pageNum}&limit=20`)
      const data = await res.json()
      if (data.success) {
        if (pageNum === 1) {
          setPosts(data.data.posts)
        } else {
          setPosts(prev => [...prev, ...data.data.posts])
        }
        setHasMore(data.data.posts.length === 20)
      } else {
        setError(data.error || 'Failed to load posts')
      }
    } catch {
      setError('Network error')
    }
  }, [])

  const fetchRateLimits = useCallback(async () => {
    try {
      const res = await fetch('/api/rate-limit/usage')
      const data = await res.json()
      if (data.success) {
        setRateLimits(data.data)
      }
    } catch {
      // Silent fail
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true)
    Promise.all([fetchPosts(1), fetchRateLimits()]).finally(() => setIsLoading(false))
  }, [authLoading, isAuthenticated, router, fetchPosts, fetchRateLimits])

  // SSE for real-time updates
  useEffect(() => {
    if (!isAuthenticated) return
    
    const eventSource = new EventSource('/api/posts/events')
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'new_post') {
          setPosts(prev => [data.post, ...prev])
        }
      } catch {
        // Ignore parse errors
      }
    }
    
    eventSource.onerror = () => {
      // Connection error - will auto-reconnect
    }
    
    return () => {
      eventSource.close()
    }
  }, [isAuthenticated])

  const handleCreatePost = async (content: string) => {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    })
    const data = await res.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create post')
    }
    
    // Add post to list if not already there via SSE
    if (data.data?.post) {
      setPosts(prev => {
        if (prev.some(p => p.id === data.data.post.id)) return prev
        return [data.data.post, ...prev]
      })
    }
    
    await fetchRateLimits()
    return data.data.post
  }

  const handleDeletePost = async (id: number) => {
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
    const data = await res.json()
    
    if (data.success) {
      setPosts(prev => prev.filter(p => p.id !== id))
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchPosts(nextPage)
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Shared Notepad</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:inline">{user?.username}</span>
            <Button onClick={handleLogout} variant="ghost" size="sm">
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {/* Post Creator */}
        {user && (
          <PostCreator 
            onPostCreated={handleCreatePost} 
            rateLimits={rateLimits}
          />
        )}

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No posts yet. Be the first to share!</p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user?.id || 0}
                onDelete={handleDeletePost}
              />
            ))
          )}
        </div>

        {/* Load More */}
        {hasMore && posts.length > 0 && (
          <div className="mt-6 text-center">
            <Button onClick={loadMore} variant="secondary">
              Load More
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
