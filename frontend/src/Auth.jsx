
import { useState } from 'react'
import API_BASE_URL from './api'
import './Auth.css'

function Auth({ onLogin, onBack }) {
  const [isRegister, setIsRegister] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      const endpoint = isRegister ? 'register' : 'login'

      const response = await fetch(
        `${API_BASE_URL}/api/auth/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            isRegister
              ? { name, email, password }
              : { email, password }
          ),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong')
      }

      // Keep token and user details in app state
      onLogin(data.token, data.user)
      setMessage(data.message)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-section">
      <form className="auth-card" onSubmit={handleSubmit}>
        <button
          type="button"
          className="auth-back"
          onClick={onBack}
        >
          ← Back to Store
        </button>

        <h1>{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
        <p>
          {isRegister
            ? 'Register to shop with CodeAlpha Store'
            : 'Login to your account'}
        </p>

        {isRegister && (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
          />
        )}

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password (minimum 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />

        <button type="submit" disabled={loading}>
          {loading
            ? 'Please wait...'
            : isRegister
              ? 'Register'
              : 'Login'}
        </button>

        {message && <p className="auth-message">{message}</p>}

        <p className="auth-switch">
          {isRegister
            ? 'Already have an account?'
            : "Don't have an account?"}
          {' '}
          <button
            type="button"
            className="auth-link"
            onClick={() => {
              setIsRegister(!isRegister)
              setMessage('')
            }}
          >
            {isRegister ? 'Login' : 'Register'}
          </button>
        </p>
      </form>
    </section>
  )
}

export default Auth