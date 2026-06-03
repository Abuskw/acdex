import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'

function Faculty({ API, t }) {
  const { id } = useParams()
  const nav = useNavigate()
  const [departments, setDepartments] = useState([])
  const [faculty, setFaculty] = useState(null)

  useEffect(() => {
    fetch(`${API}/api/faculties`).then(r => r.json()).then(d => {
      setFaculty(d.find(f => f.id == id))
    })
    fetch(`${API}/api/faculties/${id}/departments`).then(r => r.json()).then(setDepartments)
  }, [id])

  return (
    <div className="fade-in" style={{ padding: 16 }}>
      <Breadcrumbs t={t} items={[
        { label: 'Home', path: '/' },
        { label: faculty?.name || 'Faculty' }
      ]} />

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>{faculty?.name}</h2>
      
      <div style={{ display: 'grid', gap: 10 }}>
        {departments.map(d => (
          <button
            key={d.id}
            onClick={() => nav(`/department/${d.id}`, {
              state: {
                deptName: d.name,
                facultyName: faculty?.name,
                facultyId: faculty?.id
              }
            })}
            style={{
              background: t.card,
              border: `1px solid ${t.border}`,
              borderRadius: 12,
              padding: 16,
              textAlign: 'left',
              cursor: 'pointer',
              color: t.text,
              fontSize: 15
            }}
          >
            {d.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export default Faculty