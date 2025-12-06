import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, UserIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../hooks/useAuth'
import Logo from '../components/Logo'
import Input from '../components/Input'
import Button from '../components/Button'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { signIn, signUp, user } = useAuth()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await signIn(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      await signUp(email, password, fullName)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0E13] py-12 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1A1F25] via-[#0F1419] to-[#0A0E13]">
      <div className="w-full max-w-5xl">
        <div className="relative flex flex-col md:flex-row bg-[#16191E]/80 backdrop-blur-xl border border-[#5ED591]/20 rounded-3xl shadow-2xl shadow-[#5ED591]/10 overflow-hidden">

          {/* Form Panel - Always first in DOM */}
          <div className={`w-full md:w-1/2 p-8 md:p-12 transition-transform duration-300 ease-in-out ${
            isLogin ? 'md:translate-x-0' : 'md:translate-x-full'
          }`}>
            <div className="mb-8">
              <Logo />
            </div>

            {/* Toggle */}
            <div className="mb-8">
              <div className="bg-[#0F1419]/70 p-1 rounded-xl border border-gray-700/50 flex">
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all duration-300 ${
                    isLogin
                      ? 'bg-[#5ED591] text-white shadow-lg shadow-[#5ED591]/30'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all duration-300 ${
                    !isLogin
                      ? 'bg-[#5ED591] text-white shadow-lg shadow-[#5ED591]/30'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Forms with crossfade */}
            <div className="relative">
              <form
                className={`space-y-5 transition-opacity duration-200 ${
                  isLogin ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'
                }`}
                onSubmit={handleLogin}
              >
                <Input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  label="Email address"
                  icon={<EnvelopeIcon className="h-5 w-5" />}
                />

                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  label="Password"
                  icon={<LockClosedIcon className="h-5 w-5" />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="focus:outline-none text-gray-400 hover:text-[#5ED591] transition-colors"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  }
                />

                <div className="flex items-center justify-end">
                  <a
                    href="/forgot-password"
                    className="text-sm font-semibold text-[#5ED591] hover:text-[#4FFFB0] transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>

                <Button type="submit" loading={loading}>
                  Sign in
                </Button>
              </form>

              <form
                className={`space-y-5 transition-opacity duration-200 ${
                  !isLogin ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'
                }`}
                onSubmit={handleSignUp}
              >
                <Input
                  id="full-name"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  label="Full name"
                  icon={<UserIcon className="h-5 w-5" />}
                />

                <Input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  label="Email address"
                  icon={<EnvelopeIcon className="h-5 w-5" />}
                />

                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  label="Password (min 6 characters)"
                  icon={<LockClosedIcon className="h-5 w-5" />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="focus:outline-none text-gray-400 hover:text-[#5ED591] transition-colors"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  }
                />

                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  label="Confirm password"
                  icon={<LockClosedIcon className="h-5 w-5" />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="focus:outline-none text-gray-400 hover:text-[#5ED591] transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  }
                />

                <Button type="submit" loading={loading}>
                  Create account
                </Button>
              </form>
            </div>
          </div>

          {/* Welcome Panel - Always second in DOM */}
          <div className={`w-full md:w-1/2 bg-gradient-to-br from-[#5ED591]/20 via-[#5ED591]/10 to-transparent p-8 md:p-12 flex flex-col items-center justify-center transition-transform duration-300 ease-in-out ${
            isLogin ? 'md:translate-x-0 border-l' : 'md:-translate-x-full border-r'
          } border-[#5ED591]/20`}>
            <div className="text-center">
              <div className="transition-opacity duration-200">
                <h2 className="text-3xl font-bold text-white mb-4">
                  {isLogin ? 'Hello, Friend!' : 'Welcome Back!'}
                </h2>
                <p className="text-gray-300 mb-8 max-w-sm">
                  {isLogin
                    ? 'Register with your personal details to use all features of the site'
                    : 'Enter your personal details to continue your journey with us'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="px-8 py-3 rounded-xl border-2 border-[#5ED591] text-[#5ED591] font-semibold hover:bg-[#5ED591] hover:text-white transition-all duration-300"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
