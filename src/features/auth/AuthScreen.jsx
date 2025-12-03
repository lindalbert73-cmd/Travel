import React, { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'

function AuthScreen({ onAuthSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [mode, setMode] = useState('login') // login | reset

  // On mount: try to fetch current user (if session still valid)
  useEffect(() => {
    async function checkSession() {
      setLoading(true)
      try {
        const { data } = await supabase.auth.getUser()
        // Wenn keine Session existiert, ist das ok – wir bleiben einfach im Login-Screen
        if (data && data.user) {
          const user = data.user
          onAuthSuccess({ id: user.id, email: user.email || '' })
        }
      } catch (err) {
        // Fehler beim Prüfen der Session ignorieren, damit keine roten Logs erscheinen
      } finally {
        setLoading(false)
      }

    }
    checkSession()
  }, [onAuthSuccess])

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setInfo('')

    const trimmedEmail = email.trim()
    const trimmedPass = password.trim()

    if (!trimmedEmail || !trimmedPass) {
      setError('Please fill in email and password.')
      return
    }

    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: trimmedPass,
    })
    setLoading(false)

    if (error) {
      console.error('Login error', error)
      setError(error.message || 'Failed to sign in.')
      return
    }

    if (!data.user) {
      setError('No user returned from Supabase.')
      return
    }

    onAuthSuccess({ id: data.user.id, email: data.user.email || '' })
    setPassword('')
  }

  async function handleSendReset(e) {
    e.preventDefault()
    setError('')
    setInfo('')

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Please enter your email.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: window.location.origin + '/reset-password',
    })
    setLoading(false)

    if (error) {
      console.error('Reset password error', error)
      setError(error.message || 'Failed to send reset email.')
      return
    }

    setInfo('Password reset email sent. Please check your inbox.')
  }

  return (
    <div className="app-shell">
      <div className="main-area">
        <header className="page-header">
          <h1>
            <i className="fa-solid fa-user-lock" /> {mode === 'login' ? 'Sign in' : 'Reset password'}
          </h1>
          <p>
            {mode === 'login'
              ? 'Sign in with your email and password.'
              : 'Enter your email to receive a password reset link.'}
          </p>
        </header>
        <main className="app-main">
          <section className="view active">
            <div className="card form-card">
              <div className="card-header">
                <h3>
                  <i className="fa-solid fa-circle-user" /> Control console access
                </h3>
              </div>
              <div className="card-body">
                <form onSubmit={mode === 'login' ? handleLogin : handleSendReset}>
                  <div className="form-row">
                    <div className="form-field">
                      <label>Email</label>
                      <div className="input-with-icon">
                        <i className="fa-solid fa-envelope" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    {mode === 'login' && (
                      <div className="form-field">
                        <label>Password</label>
                        <div className="input-with-icon">
                          <i className="fa-solid fa-lock" />
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="auth-error">
                      <i className="fa-solid fa-circle-exclamation" /> {error}
                    </div>
                  )}
                  {info && !error && (
                    <div className="auth-info">
                      <i className="fa-solid fa-circle-info" /> {info}
                    </div>
                  )}

                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={loading}>
                      <i className="fa-solid fa-right-to-bracket" />
                      <span>
                        {loading
                          ? 'Please wait...'
                          : mode === 'login'
                          ? 'Sign in'
                          : 'Send reset link'}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => {
                        setMode(mode === 'login' ? 'reset' : 'login')
                        setError('')
                        setInfo('')
                        setPassword('')
                      }}
                    >
                      <i className="fa-solid fa-rotate" />
                      <span>
                        {mode === 'login' ? 'Forgot password?' : 'Back to sign in'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default AuthScreen
