import { useState } from 'react'

function Settings({ API, t, dark, setDark, user, setUser, token, setToken, showToast }) {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ email: '', password: '', fullName: '', role: 'student', lecturerCode: '' })
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(null)

  const handleAuth = async (e) => {
    e.preventDefault()
    setError('')
    const ep = isLogin ? '/api/auth/login' : '/api/auth/register'
    const body = isLogin ? { email: form.email, password: form.password } : form
    try {
      const res = await fetch(API + ep, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        setToken(data.token)
        setUser(data.user)
        showToast(isLogin ? 'Logged in' : 'Account created')
      } else setError(data.error)
    } catch { setError('Network error') }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    showToast('Logged out')
  }

  const clearDownloads = () => {
    if (confirm('Clear all download history?')) {
      localStorage.setItem('dl', '[]')
      showToast('Downloads cleared')
    }
  }

  const menuItems = [
    {
      key: 'downloads',
      icon: '📥',
      label: 'Downloads',
      sub: `${JSON.parse(localStorage.getItem('dl') || '[]').length} files saved`,
      content: (
        <div style={{ padding: '8px 0' }}>
          <p style={{ color: t.sub, fontSize: 13, marginBottom: 12 }}>
            {JSON.parse(localStorage.getItem('dl') || '[]').length} lectures downloaded
          </p>
          <button onClick={clearDownloads}
            style={{
              background: 'transparent', border: `1px solid ${t.red}`, color: t.red,
              padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13
            }}>
            Clear History
          </button>
        </div>
      )
    },
    {
      key: 'theme',
      icon: '🎨',
      label: 'Theme',
      sub: dark ? 'Dark mode on' : 'Light mode on',
      content: (
        <div style={{ padding: '8px 0' }}>
          <p style={{ color: t.sub, fontSize: 13, marginBottom: 12 }}>Choose your preferred theme</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setDark(false)} style={{
              flex: 1, padding: '12px', borderRadius: 10, border: !dark ? `2px solid ${t.accent}` : `1px solid ${t.border}`,
              background: !dark ? t.accent + '10' : t.card, color: t.text, cursor: 'pointer', fontWeight: !dark ? 600 : 400
            }}>
              ☀️ Light
            </button>
            <button onClick={() => setDark(true)} style={{
              flex: 1, padding: '12px', borderRadius: 10, border: dark ? `2px solid ${t.accent}` : `1px solid ${t.border}`,
              background: dark ? t.accent + '10' : t.card, color: t.text, cursor: 'pointer', fontWeight: dark ? 600 : 400
            }}>
              🌙 Dark
            </button>
          </div>
        </div>
      )
    },
    {
      key: 'about',
      icon: 'ℹ️',
      label: 'About',
      sub: 'Version 2.0.0',
      content: (
        <div style={{ padding: '8px 0' }}>
          <p style={{ color: t.sub, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
            ACdex is a centralized lecture repository for students to access past, current, and upcoming lecture materials.
          </p>
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: t.sub, fontSize: 12 }}>Version</span>
              <span style={{ fontSize: 12 }}>2.0.0</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: t.sub, fontSize: 12 }}>Built with</span>
              <span style={{ fontSize: 12 }}>React + Node.js</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: t.sub, fontSize: 12 }}>Storage</span>
              <span style={{ fontSize: 12 }}>Cloudinary</span>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'privacy',
      icon: '🔒',
      label: 'Privacy Policy',
      sub: 'How we handle your data',
      content: (
        <div style={{ padding: '8px 0' }}>
          <p style={{ color: t.sub, fontSize: 13, lineHeight: 1.8 }}>
            We collect only your name, email, and academic level to provide services. Your data is never sold or shared. Passwords are encrypted. You can delete your account anytime.
          </p>
        </div>
      )
    },
  ]

  // Login screen if not logged in
  if (!user) {
    return (
      <div className="fade-in" style={{ padding: 16, maxWidth: 400, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 30, marginTop: 20 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg, ${t.accent}, #8b5cf6)`, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
            📚
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>ACdex</h2>
          <p style={{ color: t.sub, fontSize: 13 }}>{isLogin ? 'Welcome back' : 'Create your account'}</p>
        </div>

        {error && <p style={{ color: t.red, fontSize: 13, marginBottom: 12, textAlign: 'center', background: '#fef2f2', padding: 10, borderRadius: 8 }}>{error}</p>}

        <form onSubmit={handleAuth} style={{ display: 'grid', gap: 10 }}>
          {!isLogin && (
            <>
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                style={{ padding: 12, borderRadius: 10, border: `1px solid ${t.border}`, background: t.card, color: t.text, fontSize: 14 }}>
                <option value="student">Student</option>
                <option value="lecturer">Lecturer</option>
              </select>
              <input placeholder="Full Name" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})}
                style={{ padding: 12, borderRadius: 10, border: `1px solid ${t.border}`, background: t.card, color: t.text, fontSize: 14 }} required />
              {form.role === 'lecturer' && (
                <input type="password" placeholder="Lecturer Code" value={form.lecturerCode} onChange={e => setForm({...form, lecturerCode: e.target.value})}
                  style={{ padding: 12, borderRadius: 10, border: `1px solid ${t.border}`, background: t.card, color: t.text, fontSize: 14 }} required />
              )}
            </>
          )}
          <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
            style={{ padding: 12, borderRadius: 10, border: `1px solid ${t.border}`, background: t.card, color: t.text, fontSize: 14 }} required />
          <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
            style={{ padding: 12, borderRadius: 10, border: `1px solid ${t.border}`, background: t.card, color: t.text, fontSize: 14 }} required />
          <button type="submit" style={{ background: t.accent, color: 'white', border: 'none', padding: 14, borderRadius: 10, cursor: 'pointer', fontSize: 15, fontWeight: 600, marginTop: 4 }}>
            {isLogin ? 'Login' : 'Create Account'}
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
      {/* Profile Header with Cloud Background */}
      <div style={{
        background: `linear-gradient(180deg, ${t.accent}40 0%, ${t.card} 100%)`,
        borderRadius: 16,
        padding: '30px 20px 20px',
        marginBottom: 20,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative clouds */}
        <div style={{
          position: 'absolute', top: -20, left: -30,
          width: 120, height: 60, background: 'rgba(255,255,255,0.08)',
          borderRadius: '50%', filter: 'blur(10px)'
        }} />
        <div style={{
          position: 'absolute', top: -10, right: -20,
          width: 100, height: 50, background: 'rgba(255,255,255,0.06)',
          borderRadius: '50%', filter: 'blur(8px)'
        }} />

        {/* Avatar */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: `linear-gradient(135deg, ${t.accent}, #8b5cf6)`,
          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, fontWeight: 700, margin: '0 auto 12px',
          boxShadow: '0 4px 15px rgba(59,130,246,0.3)'
        }}>
          {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 2px' }}>{user.fullName}</h2>
        <p style={{ color: t.sub, fontSize: 13, margin: '0 0 10px' }}>{user.email}</p>
        <span style={{
          display: 'inline-block', padding: '4px 16px', borderRadius: 20,
          fontSize: 12, fontWeight: 600, color: 'white',
          background: user.role === 'lecturer' ? '#8b5cf6' : user.role === 'admin' ? t.red : t.green
        }}>
          {user.role?.toUpperCase()}
        </span>
      </div>

      {/* Menu Items */}
      <div style={{ display: 'grid', gap: 6 }}>
        {menuItems.map(item => (
          <div key={item.key} style={{
            background: t.card, border: `1px solid ${t.border}`,
            borderRadius: 12, overflow: 'hidden'
          }}>
            <button
              onClick={() => setExpanded(expanded === item.key ? null : item.key)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', background: 'transparent', border: 'none',
                color: t.text, cursor: 'pointer', fontSize: 14
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontWeight: 500 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: t.sub }}>{item.sub}</div>
              </div>
              <span style={{
                transform: expanded === item.key ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s', color: t.sub
              }}>
                ›
              </span>
            </button>

            {expanded === item.key && (
              <div style={{ padding: '0 16px 16px 52px', animation: 'fadeIn 0.2s ease' }}>
                {item.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Logout Button */}
      <button
        onClick={logout}
        style={{
          width: '100%', marginTop: 20, padding: 12,
          background: 'transparent', border: `1px solid ${t.red}`,
          color: t.red, borderRadius: 10, cursor: 'pointer',
          fontSize: 14, fontWeight: 500
        }}
      >
        Logout
      </button>
    </div>
  )
}

export default Settings