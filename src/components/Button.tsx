import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'secondary'
  children: ReactNode
}

export default function Button({ 
  loading = false, 
  variant = 'primary', 
  children, 
  className = '',
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = "relative w-full flex justify-center py-3 px-4 border text-sm font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-supabase-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
  
  const variants = {
    primary: "border-[#5ED591] text-white font-semibold bg-[#5ED591] hover:bg-[#4FFFB0] hover:border-[#4FFFB0] focus:ring-[#5ED591] shadow-[0_0_20px_-5px_rgba(94,213,145,0.5)] hover:shadow-[0_0_30px_-5px_rgba(94,213,145,0.7)]",
    secondary: "border-gray-600 text-gray-200 bg-transparent hover:bg-gray-800 focus:ring-gray-500"
  }

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  )
}
