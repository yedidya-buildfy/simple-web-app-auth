import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'secondary-success' | 'secondary-destructive'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: ReactNode
}

export default function Button({
  loading = false,
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

  const sizeStyles = {
    sm: "px-2.5 py-1.5 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-sm",
    xl: "px-5 py-2.5 text-base"
  }

  const variants = {
    primary: "bg-green-500 text-white border border-green-500 hover:bg-green-600 focus:ring-green-500",
    secondary: "border border-gray-600 text-gray-200 bg-transparent hover:bg-gray-800 focus:ring-gray-500",
    'secondary-success': "border border-green-500 text-green-500 bg-transparent hover:bg-green-500/10 focus:ring-green-500",
    'secondary-destructive': "border border-red-500 text-red-500 bg-transparent hover:bg-red-500/10 focus:ring-red-500"
  }

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  )
}
