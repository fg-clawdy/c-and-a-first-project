'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { useAuth } from '@/components/auth/AuthProvider'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    secretQuestion: '',
    secretAnswer: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const validate = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/[a-zA-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password needs one letter and one number'
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    if (!formData.secretQuestion.trim()) {
      newErrors.secretQuestion = 'Secret question is required'
    }
    
    if (!formData.secretAnswer.trim()) {
      newErrors.secretAnswer = 'Secret answer is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!validate()) return
    
    setIsLoading(true)
    const result = await register(formData)
    setIsLoading(false)
    
    if (result.success) {
      router.push('/feed')
    } else {
      setError(result.error || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shared Notepad</h1>
          <p className="text-gray-600 mt-2">Create your account</p>
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
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
              autoComplete="email"
              required
            />
            
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
              helperText="Min 8 chars, 1 letter, 1 number"
              autoComplete="new-password"
              required
            />
            
            <Input
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              error={errors.confirmPassword}
              autoComplete="new-password"
              required
            />
            
            <Input
              label="Secret Question"
              type="text"
              value={formData.secretQuestion}
              onChange={(e) => setFormData({ ...formData, secretQuestion: e.target.value })}
              error={errors.secretQuestion}
              helperText="For password recovery (e.g., 'What city were you born in?')"
              required
            />
            
            <Input
              label="Secret Answer"
              type="text"
              value={formData.secretAnswer}
              onChange={(e) => setFormData({ ...formData, secretAnswer: e.target.value })}
              error={errors.secretAnswer}
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
                Create Account
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
