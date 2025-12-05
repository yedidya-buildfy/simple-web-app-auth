import { forwardRef } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: ReactNode
  rightElement?: ReactNode
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ 
  label, 
  icon, 
  rightElement,
  error, 
  className = '', 
  id,
  ...props 
}, ref) => {
  return (
    <div className={className}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200">
            <div className="text-gray-400 group-focus-within:text-[#5ED591]">
              {icon}
            </div>
          </div>
        )}
        <input
          ref={ref}
          id={id}
          className={`
            appearance-none relative block w-full px-3 py-3.5
            ${icon ? 'pl-10' : 'pl-3'}
            ${rightElement ? 'pr-10' : 'pr-3'}
            bg-[#0F1419]/70 border border-gray-600
            placeholder-gray-400 text-white rounded-xl
            focus:outline-none focus:ring-2 focus:ring-[#5ED591]/60 focus:border-[#5ED591]
            transition-all duration-200
            sm:text-sm
            ${error ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : ''}
          `}
          placeholder={label}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
