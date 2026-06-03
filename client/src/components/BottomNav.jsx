import { useNavigate, useLocation } from 'react-router-dom'

function BottomNav({ t, user }) {
  const nav = useNavigate()
  const loc = useLocation()
  const path = loc.pathname

  const items = [
    { path: '/', label: 'Home', icon: '⌂' },
    { path: '/search', label: 'Search', icon: '⌕' },
    { path: '/library', label: 'Library', icon: '♟' },
    { path: '/settings', label: 'Settings', icon: '⚙' },
  ]

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, background: t.card,
      borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-around',
      padding: '6px 0 8px', zIndex: 100, backdropFilter: 'blur(10px)'
    }}>
      {items.map(item => (
        <button key={item.path} onClick={() => nav(item.path)} style={{
          background: 'transparent', border: 'none', color: path === item.path ? t.accent : t.sub,
          fontSize: 11, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          cursor: 'pointer', padding: '4px 12px', borderRadius: 8,
          transition: 'color 0.2s'
        }}>
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
      {user?.role === 'lecturer' && (
        <button onClick={() => nav('/upload')} style={{
          background: t.accent, border: 'none', color: 'white', width: 48, height: 48,
          borderRadius: '50%', fontSize: 24, display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', marginTop: -20,
          boxShadow: '0 4px 12px rgba(59,130,246,0.4)'
        }}>+</button>
      )}
    </nav>
  )
}

export default BottomNav