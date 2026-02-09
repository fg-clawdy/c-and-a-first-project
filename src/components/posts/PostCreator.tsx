'use client'

import { useState } from 'react'
import { TextArea } from '@/components/ui/TextArea'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

interface PostCreatorProps {
  onPostCreated: (content: string) => Promise<void>
  rateLimits: {
    postsInMinute: number
    postsInHour: number
    postsInDay: number
    minuteLimit: number
    hourLimit: number
    dayLimit: number
  }
}

export function PostCreator({ onPostCreated, rateLimits }: PostCreatorProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const remaining = {
    minute: rateLimits.minuteLimit - rateLimits.postsInMinute,
    hour: rateLimits.hourLimit - rateLimits.postsInHour,
    day: rateLimits.dayLimit - rateLimits.postsInDay
  }

  const canPost = remaining.minute > 0 && remaining.hour > 0 && remaining.day > 0

  const handleSubmit = async () => {
    if (!content.trim()) return
    
    setError('')
    setSuccess('')
    setIsSubmitting(true)
    
    try {
      await onPostCreated(content.trim())
      setContent('')
      setSuccess('Post created!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 mb-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Create Post</h2>
      
      {error && (
        <div className="mb-3">
          <Alert type="error">{error}</Alert>
        </div>
      )}
      
      {success && (
        <div className="mb-3">
          <Alert type="success">{success}</Alert>
        </div>
      )}
      
      <TextArea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        maxLength={1000}
        rows={3}
        disabled={!canPost}
      />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
        <div className="text-sm text-gray-500">
          {!canPost ? (
            <span className="text-red-500 font-medium">Rate limit reached</span>
          ) : (
            <span>
              {remaining.minute}/{rateLimits.minuteLimit} per min · 
              {remaining.hour}/{rateLimits.hourLimit} per hour · 
              {remaining.day}/{rateLimits.dayLimit} per day
            </span>
          )}
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || !canPost || isSubmitting}
          isLoading={isSubmitting}
        >
          Post
        </Button>
      </div>
    </div>
  )
}
