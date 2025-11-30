import React, { useEffect, useState } from 'react'
import { loadAuthConfig, saveAuthConfig, hashPassword } from '../../utils/authConfig'

function AuthScreen({ onAuthSuccess }) {
  const [mode, setMode] = useState('setup') // setup | login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const cfg = loadAuthConfig()
    if (cfg && cfg.email && cfg.passwordHash) {
      setMode('login')
      setEmail(cfg.email)
    } else {
      setMode('setup')
    }
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const trimmedEmail = email.trim()
    const trimmedPass = password.trim()

    if (!trimmedEmail || !trimmedPass) {
      setError('Please fill in email and password.')
      return
    }

    const existing = loadAuthConfig()

    if (!existing && mode === 'setup') {
      // Erste Einrichtung
      const cfg = {
        email: trimmedEmail,
        passwordHash: hashPassword(trimmedEmail, trimmedPass),
        programName: 'Control console',
      }
      saveAuthConfig(cfg)
      onAuthSuccess({ email: cfg.email, programName: cfg.programName })
      setPassword('')
      return
    }

    if (!existing) {
      setError('No account found. Please do initial setup.')
      setMode('setup')
      return
    }

    if (existing.email !== trimmedEmail) {
      setError('This email is not registered.')
      return
    }

    const hash = hashPassword(trimmedEmail, trimmedPass)
    if (hash !== existing.passwordHash) {
      setError('Incorrect password.')
      return
    }

    onAuthSuccess({ email: existing.email, programName: existing.programName || 'Control console' })
    setPassword('')
  }

  return (
    <div className="app-shell">
      <div className="main-area">
        <header className="page-header">
          <h1>
            <i className="fa-solid fa-user-lock" /> {mode === 'setup' ? 'Initial setup' : 'Sign in'}
          </h1>
          <p>
            {mode === 'setup'
              ? 'Create your owner account for this dashboard (stored only in this browser).'
              : 'Sign in with the owner email and password.'}
          </p>
        </header>
        <main className="app-main">
          <section className="view active">
            <div className="card form-card">
              <div className="card-header">
                <h3>
                  <i className="fa-solid fa-key" /> {mode === 'setup' ? 'Set up owner account' : 'Login'}
                </h3>
              </div>
              <div className="card-body">
                <form
                  onSubmit={handleSubmit}
                  autoComplete="off"
                >
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
                  </div>

                  {error && (
                    <div className="auth-error">
                      <i className="fa-solid fa-circle-exclamation" /> {error}
                    </div>
                  )}

                  <div className="form-actions">
                    {mode === 'login' && (
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => {
                          setMode('setup')
                          setError('')
                          setPassword('')
                        }}
                      >
                        <i className="fa-solid fa-user-plus" />
                        <span>Re-run setup</span>
                      </button>
                    )}
                    <button type="submit" className="btn-primary">
                      <i className="fa-solid fa-right-to-bracket" />
                      <span>{mode === 'setup' ? 'Create owner account' : 'Sign in'}</span>
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
