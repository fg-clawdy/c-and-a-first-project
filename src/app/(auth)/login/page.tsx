'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { useAuth } from '@/components/auth/AuthProvider'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!validate()) return
    
    setIsLoading(true)
    const result = await login(formData.username, formData.password)
    setIsLoading(false)
    
    if (result.success) {
      router.push('/feed')
    } else {
      setError(result.error || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shared Notepad</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>
        
        <Card>
          {error && (
            <div className="mb-4">
              <Alert type="error">{error}</Alert>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              error={errors.username}
              autoComplete="username"
              required
            />
            
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
              autoComplete="current-password"
              required
            />
            
            <div className="pt-2">
              <Button 
                type="submit" 
                variant="primary" 
                size="lg" 
                isLoading={isLoading}
                className="w-full"
              >
                Sign In
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center space-y-2">
            <Link 
              href="/reset-password" 
              className="text-sm text-blue-600 hover:text-blue-800 block"
            >
              Forgot password?
            </Link>
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                Create one
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
