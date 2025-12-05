import type { ReactNode } from 'react'
import Logo from './Logo'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle?: ReactNode
  footer?: ReactNode
}

export default function AuthLayout({ children, title, subtitle, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0E13] py-12 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1A1F25] via-[#0F1419] to-[#0A0E13]">
      <div className="w-full max-w-md space-y-8">

        {/* Card Container */}
        <div className="bg-[#16191E]/80 backdrop-blur-xl border border-[#5ED591]/20 rounded-3xl p-8 shadow-2xl shadow-[#5ED591]/10">
          <div className="mb-8">
            <Logo />
            <h2 className="mt-6 text-center text-2xl font-bold text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 text-center text-sm text-gray-300">
                {subtitle}
              </p>
            )}
          </div>

          {children}
        </div>

        {footer && (
          <div className="text-center">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
