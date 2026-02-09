'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'

type Step = 1 | 2 | 3

export default function ResetPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [formData, setFormData] = useState({
    username: '',
    secretQuestion: '',
    secretAnswer: '',
    newPassword: '',
    confirmNewPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    try {
      const res = await fetch(`/api/auth/reset-password?username=${encodeURIComponent(formData.username)}`)
      const data = await res.json()
      
      if (data.success) {
        setFormData(prev => ({ ...prev, secretQuestion: data.data.secretQuestion }))
        setStep(2)
      } else {
        setError(data.error || 'User not found')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!formData.secretAnswer.trim()) {
      setError('Please answer the secret question')
      return
    }
    
    setStep(3)
  }

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    
    if (!/[a-zA-Z]/.test(formData.newPassword) || !/[0-9]/.test(formData.newPassword)) {
      setError('Password needs one letter and one number')
      return
    }
    
    if (formData.newPassword !== formData.confirmNewPassword) {
      setError('Passwords do not match')
      return
    }
    
    setIsLoading(true)
    
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          secretAnswer: formData.secretAnswer,
          newPassword: formData.newPassword,
          confirmNewPassword: formData.confirmNewPassword
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setSuccess('Password reset successful! Redirecting to login...')
        setTimeout(() => router.push('/login'), 2000)
      } else {
        setError(data.error || 'Failed to reset password')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <p className="text-gray-600 mb-4">Enter your username to begin password recovery.</p>
            <form onSubmit={handleStep1} className="space-y-4">
              <Input
                label="Username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
              <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
                Continue
              </Button>
            </form>
          </>
        )
      
      case 2:
        return (
          <>
            <p className="text-gray-600 mb-4">Answer your secret question to verify your identity.</p>
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <p className="font-medium text-gray-900">{formData.secretQuestion}</p>
            </div>
            <form onSubmit={handleStep2} className="space-y-4">
              <Input
                label="Your Answer"
                type="text"
                value={formData.secretAnswer}
                onChange={(e) => setFormData({ ...formData, secretAnswer: e.target.value })}
                required
              />
              <div className="flex gap-3">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" variant="primary" className="flex-1">
                  Continue
                </Button>
              </div>
            </form>
          </>
        )
      
      case 3:
        return (
          <>
            <p className="text-gray-600 mb-4">Set your new password.</p>
            <form onSubmit={handleStep3} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                helperText="Min 8 chars, 1 letter, 1 number"
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={formData.confirmNewPassword}
                onChange={(e) => setFormData({ ...formData, confirmNewPassword: e.target.value })}
                required
              />
              <div className="flex gap-3">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>
                  Reset Password
                </Button>
              </div>
            </form>
          </>
        )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-600 mt-2">Step {step} of 3</p>
        </div>
        
        <Card>
          {error && (
            <div className="mb-4">
              <Alert type="error">{error}</Alert>
            </div>
          )}
          
          {success && (
            <div className="mb-4">
              <Alert type="success">{success}</Alert>
            </div>
          )}
          
          {renderStep()}
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
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
