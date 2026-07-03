import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './AuthModal.css'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

type Mode = 'signIn' | 'signUp' | 'forgotPassword'

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { signIn, signUp, resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    try {
      if (mode === 'forgotPassword') {
        const { error } = await resetPassword(email)
        if (error) {
          setError(error.message)
        } else {
          setSuccessMessage('Password reset email sent. Check your inbox for a link.')
          setEmail('')
        }
      } else if (mode === 'signUp') {
        const { error } = await signUp(email, password)
        if (error) {
          setError(error.message)
        } else {
          setSuccessMessage('Account created! Please check your email to verify your account.')
          setEmail('')
          setPassword('')
        }
      } else {
        const { error } = await signIn(email, password)
        if (error) {
          setError(error.message)
        } else {
          onClose()
          setEmail('')
          setPassword('')
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (newMode: Mode) => {
    setMode(newMode)
    setError(null)
    setSuccessMessage(null)
    setEmail('')
    setPassword('')
  }

  if (!isOpen) return null

  const titles: Record<Mode, string> = {
    signIn: 'Sign In',
    signUp: 'Create Account',
    forgotPassword: 'Reset Password',
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>×</button>

        <h2 className="auth-modal-title">{titles[mode]}</h2>

        {successMessage && (
          <div className="auth-message auth-message-success">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="auth-message auth-message-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="your@email.com"
            />
          </div>

          {mode !== 'forgotPassword' && (
            <div className="auth-form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          )}

          {mode === 'signIn' && (
            <button
              type="button"
              className="auth-switch-button auth-forgot-password"
              onClick={() => switchMode('forgotPassword')}
              disabled={loading}
            >
              Forgot password?
            </button>
          )}

          <button
            type="submit"
            className="auth-submit-button"
            disabled={loading}
          >
            {loading
              ? 'Loading...'
              : mode === 'signUp'
                ? 'Sign Up'
                : mode === 'forgotPassword'
                  ? 'Send Reset Link'
                  : 'Sign In'}
          </button>
        </form>

        <div className="auth-modal-footer">
          {mode === 'forgotPassword' ? (
            <button
              type="button"
              className="auth-switch-button"
              onClick={() => switchMode('signIn')}
              disabled={loading}
            >
              Back to Sign In
            </button>
          ) : (
            <>
              <span>
                {mode === 'signUp' ? 'Already have an account? ' : "Don't have an account? "}
              </span>
              <button
                type="button"
                className="auth-switch-button"
                onClick={() => switchMode(mode === 'signUp' ? 'signIn' : 'signUp')}
                disabled={loading}
              >
                {mode === 'signUp' ? 'Sign In' : 'Sign Up'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
