'use client'

import React from 'react'

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  maxLength?: number
}

export function TextArea({
  label,
  error,
  helperText,
  maxLength,
  className = '',
  ...props
}: TextAreaProps) {
  const value = props.value || ''
  const charCount = typeof value === 'string' ? value.length : 0
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        className={`
          block w-full rounded-lg border-gray-300 shadow-sm
          focus:border-blue-500 focus:ring-blue-500
          disabled:bg-gray-100 disabled:text-gray-500
          text-base min-h-[120px] px-4 py-3 resize-y
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      />
      <div className="flex justify-between items-center mt-1.5">
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : helperText ? (
          <p className="text-sm text-gray-500">{helperText}</p>
        ) : (
          <span />
        )}
        {maxLength && (
          <p className={`text-sm ${charCount > maxLength ? 'text-red-500' : 'text-gray-400'}`}>
            {charCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  )
}
