import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'

function Levels({ t }) {
  const { courseId } = useParams()
  const nav = useNavigate()
  const location = useLocation()
  const { courseName, courseCode } = location.state || {}
  const levels = [100, 200, 300, 400]

  return (
    <div className="fade-in" style={{ padding: 16 }}>
      <button onClick={() => nav(-1)} style={{
        background: 'transparent', border: 'none', color: t.accent, fontSize: 14, cursor: 'pointer', marginBottom: 16
      }}>
        ← Back
      </button>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{courseCode}</h2>
      <p style={{ color: t.sub, fontSize: 14, marginBottom: 20 }}>{courseName}</p>
      <p style={{ color: t.sub, fontSize: 13, marginBottom: 16 }}>Select your level</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {levels.map(level => (
          <button
            key={level}
            onClick={() => nav(`/level/${courseId}/${level}`, { state: { courseName, courseCode } })}
            style={{
              background: t.card,
              border: `1px solid ${t.border}`,
              borderRadius: 12,
              padding: 24,
              textAlign: 'center',
              cursor: 'pointer',
              color: t.text,
              fontSize: 18,
              fontWeight: 600
            }}
          >
            {level} Level
          </button>
        ))}
      </div>
    </div>
  )
}

export default Levels