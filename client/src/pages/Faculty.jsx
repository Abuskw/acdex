import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'

function Faculty({ API, t }) {
  const { id } = useParams()
  const nav = useNavigate()
  const [faculty, setFaculty] = useState(null)
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    fetch(`${API}/api/faculties`).then(r => r.json()).then(d => {
      setFaculty(d.find(f => f.id == id))
    })
    fetch(`${API}/api/faculties/${id}/departments`).then(r => r.json()).then(d => {
      setDepartments(d)
    })
  }, [id])

  return (
    <div className="fade-in" style={{ padding: 16 }}>
      <Breadcrumbs t={t} items={[
        { label: 'Home', path: '/' },
        { label: faculty?.name || 'Faculty' }
      ]} />

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{faculty?.name}</h2>
      <p style={{ color: t.sub, fontSize: 13, marginBottom: 20 }}>Select Department</p>

      <div style={{ display: 'grid', gap: 8 }}>
        {departments.map(dept => (
          <button
            key={dept.id}
            onClick={() => nav(`/department/${dept.id}`, { 
              state: { deptName: dept.name, facultyName: faculty?.name, facultyId: faculty?.id } 
            })}
            style={{
              background: t.card,
              border: `1px solid ${t.border}`,
              borderRadius: 10,
              padding: '14px 16px',
              textAlign: 'left',
              cursor: 'pointer',
              color: t.text,
              fontSize: 15,
              fontWeight: 500
            }}
          >
            {dept.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export default Faculty