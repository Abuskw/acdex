import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import PDFViewer from './components/PDFViewer'
import Home from './pages/Home'
import Faculty from './pages/Faculty'
import Department from './pages/Department'
import Level from './pages/Level'
import Course from './pages/Course'
import Search from './pages/Search'
import Library from './pages/Library'
import Settings from './pages/Settings'
import Upload from './pages/Upload'
import Admin from './pages/Admin'

function App() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('darkMode') === 'true'
  })
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'))
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [toast, setToast] = useState(null)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [pdfTitle, setPdfTitle] = useState('')

  const API = 'http://localhost:5000'
  const t = dark
    ? { bg: '#0f172a', card: '#1e293b', text: '#e2e8f0', sub: '#94a3b8', border: '#334155', header: '#1e3a5f', accent: '#3b82f6', green: '#10b981', red: '#ef4444' }
    : { bg: '#f1f5f9', card: '#fff', text: '#1e293b', sub: '#64748b', border: '#e2e8f0', header: '#1e40af', accent: '#3b82f6', green: '#10b981', red: '#ef4444' }

  const showToast = (msg, type) => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const props = { API, t, dark, setDark, user, setUser, token, setToken, showToast, setPdfUrl, setPdfTitle }

  return (
    <BrowserRouter>
      <div className={dark ? 'dark' : ''} style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh', paddingBottom: 70, transition: 'all 0.3s' }}>
        {/* Sticky Header */}
        <header style={{
          background: t.header, color: 'white', padding: '12px 16px',
          position: 'sticky', top: 0, zIndex: 100, display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>LectureVault</h1>
          <button
            onClick={() => {
              const newDark = !dark
              setDark(newDark)
              localStorage.setItem('darkMode', newDark)
            }}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
              padding: '6px 12px', borderRadius: 20, fontSize: 13, cursor: 'pointer'
            }}
          >
            {dark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </header>

        {/* Toast */}
        {toast && (
          <div onClick={() => setToast(null)} style={{
            position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
            background: toast.type === 'error' ? t.red : t.green, color: 'white',
            padding: '10px 24px', borderRadius: 30, zIndex: 999,
            fontSize: 14, fontWeight: 500, cursor: 'pointer', animation: 'slideUp 0.3s ease',
            whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            {toast.msg}
          </div>
        )}

        <Routes>
          <Route path="/" element={<Home {...props} />} />
          <Route path="/faculty/:id" element={<Faculty {...props} />} />
          <Route path="/department/:id" element={<Department {...props} />} />
          <Route path="/level/:deptId/:level" element={<Level {...props} />} />
          <Route path="/course/:id" element={<Course {...props} />} />
          <Route path="/search" element={<Search {...props} />} />
          <Route path="/library" element={<Library {...props} />} />
          <Route path="/settings" element={<Settings {...props} />} />
          <Route path="/upload" element={<Upload {...props} />} />
          <Route path="/admin" element={<Admin {...props} />} />
        </Routes>

        <PDFViewer url={pdfUrl} title={pdfTitle} onClose={() => setPdfUrl(null)} />

        {/* Admin Floating Button – uses window.location to avoid useNavigate outside Router */}
        {user?.role === 'admin' && (
          <button
            onClick={() => { window.location.href = '/admin' }}
            style={{
              position: 'fixed',
              bottom: 80,
              right: 20,
              background: t.red,
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: 50,
              height: 50,
              fontSize: 20,
              cursor: 'pointer',
              zIndex: 200,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
            title="Admin Panel"
          >
            ⚙
          </button>
        )}

        <BottomNav {...props} />
      </div>
    </BrowserRouter>
  )
}

export default App