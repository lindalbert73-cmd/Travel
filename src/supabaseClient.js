// Minimal local stub to satisfy imports in App.jsx.
// This DOES NOT connect to a real Supabase backend.
// It just pretends there is always a logged-in demo user.

export const supabase = {
  auth: {
    async signInWithPassword({ email, password }) {
      return {
        data: {
          user: {
            id: 'local-user',
            email: email || 'demo@example.com',
          },
        },
        error: null,
      }
    },
    async signUp({ email, password }) {
      return {
        data: {
          user: {
            id: 'local-user',
            email: email || 'demo@example.com',
          },
        },
        error: null,
      }
    },
    async getSession() {
      // Start without a session; App's onAuthStateChange stub below
      // will "log in" a demo user immediately.
      return {
        data: {
          session: null,
        },
        error: null,
      }
    },
    onAuthStateChange(callback) {
      // Immediately simulate that a user is signed in so the dashboard is usable.
      const session = {
        user: {
          id: 'local-user',
          email: 'demo@example.com',
        },
      }
      try {
        callback('SIGNED_IN', session)
      } catch (e) {
        console.error('Auth callback error in stub onAuthStateChange', e)
      }
      return {
        data: {
          subscription: {
            unsubscribe() {
              // no-op
            },
          },
        },
        error: null,
      }
    },
    async signOut() {
      // No real session to clear; just pretend it's fine.
      return { error: null }
    },
  },
}
