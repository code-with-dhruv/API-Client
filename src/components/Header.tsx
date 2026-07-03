import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import AuthModal from './AuthModal'
import './Header.css'

function Header() {
  const { user, signOut, loading } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const handleLoginClick = () => {
    setIsAuthModalOpen(true)
  }

  const handleLogout = async () => {
    await signOut()
  }

  if (loading) {
    return (
      <header className="header">
        <div className="header-content">
          <div className="header-right">
            <span className="header-loading">Loading...</span>
          </div>
        </div>
      </header>
    )
  }

  return (
    <>
      <header className="header">
        <div className="header-content">
          <div className="header-right">
            <button
              className="theme-toggle-button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            {user ? (
              <>
                <span className="header-user-email">{user.email}</span>
                <button className="login-button" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <button className="login-button" onClick={handleLoginClick}>
                Login
              </button>
            )}
          </div>
        </div>
      </header>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  )
}

export default Header

