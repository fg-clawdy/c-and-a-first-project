'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'

interface Post {
  id: number
  content: string
  author: string
  userId: number
  createdAt: string
}

interface PostCardProps {
  post: Post
  currentUserId: number
  onDelete: (id: number) => Promise<void>
}

export function PostCard({ post, currentUserId, onDelete }: PostCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const isOwnPost = post.userId === currentUserId

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    await onDelete(post.id)
    setIsDeleting(false)
    setShowDeleteModal(false)
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">
                {post.author.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{post.author}</p>
              <p className="text-sm text-gray-500">{formatTime(post.createdAt)}</p>
            </div>
          </div>
          
          {isOwnPost && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-gray-400 hover:text-red-500 p-2 min-h-[44px] min-w-[44px] transition-colors"
              aria-label="Delete post"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
        
        <div className="mt-3 text-gray-800 whitespace-pre-wrap break-words">
          {post.content}
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Post"
        confirmText="Delete"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      >
        <p>Are you sure you want to delete this post? This action cannot be undone.</p>
      </Modal>
    </>
  )
}
