import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Home({ API, t }) {
  const [faculties, setFaculties] = useState([])
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()

  useEffect(() => {
    fetch(`${API}/api/faculties`).then(r => r.json()).then(d => {
      setFaculties(d)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="fade-in" style={{ padding: 16 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Faculties</h2>
      {loading ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ background: t.border, borderRadius: 12, height: 64, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {faculties.map(f => (
            <button
              key={f.id}
              onClick={() => nav(`/faculty/${f.id}`)}
              style={{
                background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: 16,
                textAlign: 'left', color: t.text, fontSize: 15, fontWeight: 500,
                transition: 'background 0.2s, transform 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={e => e.currentTarget.style.background = t.border}
              onMouseLeave={e => e.currentTarget.style.background = t.card}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Home