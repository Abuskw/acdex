import { useState } from 'react'

function Settings({ API, t, dark, setDark, user, setUser, token, setToken, showToast }) {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ email: '', password: '', fullName: '', role: 'student', lecturerCode: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
const [tab, setTab] = useState('account')
  const registerWithBackend = async (firebaseUser, role, lecturerCode) => {
    const res = await fetch(`${API}/api/auth/firebase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: firebaseUser.email,
        fullName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        role: role || 'student',
        lecturerCode: lecturerCode || ''
      })
    })
    const data = await res.json()
    if (data.token) {
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setToken(data.token)
      setUser(data.user)
      return true
    }
    return false
  }
const getErrorMessage = (err) => {
  const messages = {
    'auth/weak-password': 'Password must be at least 6 characters',
    'auth/invalid-email': 'Please enter a valid email address',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/email-already-in-use': 'An account already exists with this email',
    'auth/popup-blocked': 'Please allow popups for this site',
    'auth/popup-closed-by-user': 'Sign in cancelled',
    'auth/network-request-failed': 'Network error. Check your connection',
    'auth/invalid-credential': 'Invalid email or password',
    'auth/too-many-requests': 'Too many attempts. Please try again later',
  }
  return messages[err.code] || err.message
}
  

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return setError('Fill all fields')
    setLoading(true)
    setError('')
    try {
      let firebaseUser
      if (isLogin) {
        const result = await window.signInWithEmailAndPassword(window.firebaseAuth, form.email, form.password)
        firebaseUser = result.user
      } else {
        const result = await window.createUserWithEmailAndPassword(window.firebaseAuth, form.email, form.password)
        firebaseUser = result.user
      }
      const ok = await registerWithBackend(firebaseUser, form.role, form.lecturerCode)
      if (ok) showToast(isLogin ? 'Logged in!' : 'Account created!')
      else setError('Failed to register with server')
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await window.signOut(window.firebaseAuth)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setToken(null)
      setUser(null)
      showToast('Logged out')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  // Login screen
  if (!user) {
    return (
      <div className="fade-in" style={{ padding: 16, maxWidth: 400, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 30, marginTop: 20 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg, ${t.accent}, #8b5cf6)`, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
            📚
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>ACdex</h2>
          <p style={{ color: t.sub, fontSize: 13 }}>{isLogin ? 'Welcome back' : 'Create account'}</p>
        </div>

        {error && <p style={{ color: t.red, fontSize: 13, marginBottom: 12, textAlign: 'center', background: '#fef2f2', padding: 10, borderRadius: 8 }}>{error}</p>}

       

        {/* Email Login Form */}
        <form onSubmit={handleEmailAuth} style={{ display: 'grid', gap: 10 }}>
          {!isLogin && (
            <>
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                style={{ padding: 12, borderRadius: 10, border: `1px solid ${t.border}`, background: t.card, color: t.text, fontSize: 14 }}>
                <option value="student">Student</option>
                <option value="lecturer">Lecturer</option>
              </select>
              {form.role === 'lecturer' && (
                <input type="password" placeholder="Lecturer Code" value={form.lecturerCode}
                  onChange={e => setForm({...form, lecturerCode: e.target.value})}
                  style={{ padding: 12, borderRadius: 10, border: `1px solid ${t.border}`, background: t.card, color: t.text, fontSize: 14 }} />
              )}
            </>
          )}
          <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
            style={{ padding: 12, borderRadius: 10, border: `1px solid ${t.border}`, background: t.card, color: t.text, fontSize: 14 }} required />
          <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
            style={{ padding: 12, borderRadius: 10, border: `1px solid ${t.border}`, background: t.card, color: t.text, fontSize: 14 }} required />
          <button type="submit" disabled={loading}
            style={{ background: t.accent, color: 'white', border: 'none', padding: 14, borderRadius: 10, cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
          </button>
        </form>

        <p onClick={() => { setIsLogin(!isLogin); setError('') }}
          style={{ textAlign: 'center', color: t.accent, cursor: 'pointer', marginTop: 18, fontSize: 13 }}>
          {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
        </p>
      </div>
    )
  }

  // Logged in view
  return (
    <div className="fade-in" style={{ padding: 16, maxWidth: 400, margin: '0 auto' }}>
      <div style={{
        background: `linear-gradient(180deg, ${t.accent}40 0%, ${t.card} 100%)`,
        borderRadius: 16, padding: '30px 20px 20px', marginBottom: 20, textAlign: 'center'
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: `linear-gradient(135deg, ${t.accent}, #8b5cf6)`,
          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, fontWeight: 700, margin: '0 auto 12px'
        }}>
          {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 2px' }}>{user.fullName}</h2>
        <p style={{ color: t.sub, fontSize: 13, margin: '0 0 10px' }}>{user.email}</p>
        <span style={{
          display: 'inline-block', padding: '4px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: 'white',
          background: user.role === 'lecturer' ? '#8b5cf6' : user.role === 'admin' ? t.red : t.green
        }}>{user.role?.toUpperCase()}</span>
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🌙 Dark Mode</span>
          <div onClick={() => setDark(!dark)} style={{ width: 50, height: 28, borderRadius: 14, background: dark ? t.accent : t.border, cursor: 'pointer', position: 'relative' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: dark ? 24 : 2, transition: 'all 0.3s' }} />
          </div>
        </div>
      </div>
{tab === 'privacy' && (
  <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20, marginTop: 12 }}>
    <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Privacy Policy</h3>
    <p style={{ color: t.sub, fontSize: 13, lineHeight: 1.8 }}>
      We collect only your name, email, and academic level to provide services. Your data is never sold or shared with third parties. Passwords are encrypted via Firebase. You can delete your account at any time.
    </p>
  </div>
)}

{tab === 'terms' && (
  <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20, marginTop: 12 }}>
    <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Terms & Conditions</h3>
    <p style={{ color: t.sub, fontSize: 13, lineHeight: 1.8 }}>
      Lecture materials are for educational use only. Do not redistribute without permission. The platform is provided "as is" without warranties. We reserve the right to remove content that violates our policies.
    </p>
  </div>
)}

{tab === 'about' && (
  <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20, marginTop: 12 }}>
    <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>About ACdex</h3>
    <p style={{ color: t.sub, fontSize: 13, lineHeight: 1.8 }}>
      ACdex is a centralized lecture repository for students to access past, current, and upcoming lecture materials across all faculties and departments. Built with React + Node.js.
    </p>
  </div>
)}

{tab === 'contact' && (
  <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20, marginTop: 12 }}>
    <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Contact</h3>
    <p style={{ color: t.sub, fontSize: 13, lineHeight: 1.8 }}>
      For support, suggestions, or inquiries, please contact your faculty administrator or the IT department.
    </p>
  </div>
)}
      <button onClick={handleLogout}
        style={{ width: '100%', marginTop: 20, padding: 12, background: 'transparent', border: `1px solid ${t.red}`, color: t.red, borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
        Logout
      </button>
      {/* Legal & Support */}
<div style={{ marginTop: 32, textAlign: 'center' }}>
  <p style={{ color: t.sub, fontSize: 11, marginBottom: 12 }}>Legal & Support</p>
  <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
    <span style={{ color: t.accent, fontSize: 12, cursor: 'pointer' }} onClick={() => setTab('privacy')}>Privacy Policy</span>
    <span style={{ color: t.accent, fontSize: 12, cursor: 'pointer' }} onClick={() => setTab('terms')}>Terms & Conditions</span>
    <span style={{ color: t.accent, fontSize: 12, cursor: 'pointer' }} onClick={() => setTab('about')}>About</span>
    <span style={{ color: t.accent, fontSize: 12, cursor: 'pointer' }} onClick={() => setTab('contact')}>Contact</span>
  </div>
  <p style={{ color: t.sub, fontSize: 10 }}>ACdex v2.0.0 • Made for Students</p>
</div>
    </div>
  )
}

export default Settings