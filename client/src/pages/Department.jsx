import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'

function Department({ API, t }) {
  const { id } = useParams()
  const nav = useNavigate()
  const location = useLocation()
  const { deptName, facultyName, facultyId } = location.state || {}
  const [courses, setCourses] = useState([])
  const levels = [100, 200, 300, 400]

  useEffect(() => {
    fetch(`${API}/api/courses`).then(r => r.json()).then(d =>
      setCourses(d.filter(c => c.departmentId == id))
    )
  }, [id])

  return (
    <div className="fade-in" style={{ padding: 16 }}>
      <Breadcrumbs t={t} items={[
        { label: 'Home', path: '/' },
        { label: facultyName || 'Faculty', path: facultyId ? `/faculty/${facultyId}` : null },
        { label: deptName || 'Department' }
      ]} />

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{deptName}</h2>
      <p style={{ color: t.sub, fontSize: 13, marginBottom: 20 }}>Select your level</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {levels.map(level => {
          const count = courses.filter(c => c.level === level).length
          return (
            <button
              key={level}
              onClick={() => nav(`/level/${id}/${level}`, {
                state: { deptName, facultyName, facultyId }
              })}
              style={{
                background: t.card,
                border: `1px solid ${t.border}`,
                borderRadius: 12,
                padding: 20,
                textAlign: 'center',
                cursor: 'pointer',
                color: t.text,
                fontSize: 16,
                fontWeight: 600
              }}
            >
              {level} Level
              <div style={{ fontSize: 12, fontWeight: 400, marginTop: 4, color: t.sub }}>{count} courses</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default Department