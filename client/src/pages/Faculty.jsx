import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'

function Faculty({ API, t }) {
  const { id } = useParams()
  const nav = useNavigate()
  const [faculty, setFaculty] = useState(null)
  const [courses, setCourses] = useState([])
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    fetch(`${API}/api/faculties`).then(r => r.json()).then(d => {
      setFaculty(d.find(f => f.id == id))
    })
    fetch(`${API}/api/faculties/${id}/departments`).then(r => r.json()).then(d => {
      setDepartments(d)
      // Fetch courses for each department
      fetch(`${API}/api/courses`).then(r => r.json()).then(allCourses => {
        const deptIds = d.map(dept => dept.id)
        setCourses(allCourses.filter(c => deptIds.includes(c.departmentId)))
      })
    })
  }, [id])

  return (
    <div className="fade-in" style={{ padding: 16 }}>
      <Breadcrumbs t={t} items={[
        { label: 'Home', path: '/' },
        { label: faculty?.name || 'Faculty' }
      ]} />

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>{faculty?.name}</h2>
      <p style={{ color: t.sub, fontSize: 13, marginBottom: 16 }}>Select your course of study</p>

      <div style={{ display: 'grid', gap: 20 }}>
        {departments.map(dept => {
          const deptCourses = courses.filter(c => c.departmentId === dept.id)
          if (deptCourses.length === 0) return null
          return (
            <div key={dept.id}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: t.sub, marginBottom: 8, paddingLeft: 4 }}>
                {dept.name}
              </h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {deptCourses.map(c => (
                  <button
                    key={c.id}
                    onClick={() => nav(`/levels/${c.id}`, { state: { courseName: c.title, courseCode: c.code } })}
                    style={{
                      background: t.card,
                      border: `1px solid ${t.border}`,
                      borderRadius: 10,
                      padding: '14px 16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: t.text,
                      fontSize: 14
                    }}
                  >
                    <strong>{c.code}</strong> - {c.title}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Faculty