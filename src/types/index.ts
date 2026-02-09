export interface User {
  id: number
  username: string
  email: string
  createdAt: Date
}

export interface Post {
  id: number
  content: string
  author: string
  createdAt: Date
  userId: number
}

export interface PostWithAuthor extends Post {
  author: string
}

export interface RateLimitInfo {
  postsInMinute: number
  postsInHour: number
  postsInDay: number
  minuteLimit: number
  hourLimit: number
  dayLimit: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
