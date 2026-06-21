import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'

function Faculty({ API, t }) {
  const { id } = useParams()
  const nav = useNavigate()
  const [faculty, setFaculty] = useState(null)
  const [courses, setCourses] = useState([])
  const [departments, setDepartments] = useState([])
  const [expandedDept, setExpandedDept] = useState(null)

  useEffect(() => {
    fetch(`${API}/api/faculties`).then(r => r.json()).then(d => {
      setFaculty(d.find(f => f.id == id))
    })
    fetch(`${API}/api/faculties/${id}/departments`).then(r => r.json()).then(d => {
      setDepartments(d)
      // Fetch ALL courses fresh (not from cache)
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

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{faculty?.name}</h2>
      <p style={{ color: t.sub, fontSize: 13, marginBottom: 20 }}>Select your department and course</p>

      <div style={{ display: 'grid', gap: 8 }}>
        {departments.map(dept => {
          const deptCourses = courses.filter(c => c.departmentId === dept.id)
// Always show department, even if empty
          const isOpen = expandedDept === dept.id

          return (
            <div key={dept.id} style={{
              background: t.card,
              border: `1px solid ${t.border}`,
              borderRadius: 10,
              overflow: 'hidden'
            }}>
              {/* Department Header - Clickable */}
              <button
                onClick={() => setExpandedDept(isOpen ? null : dept.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 16px',
                  background: isOpen ? t.accent : 'transparent',
                  border: 'none',
                  color: isOpen ? 'white' : t.text,
                  cursor: 'pointer',
                  fontSize: 15,
                  fontWeight: 600,
                  textAlign: 'left'
                }}
              >
                <span>{dept.name}</span>
                <span style={{ fontSize: 18, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                  ▼
                </span>
              </button>

              {/* Courses - Shown when expanded */}
              {isOpen && (
                <div style={{ padding: '8px 16px 16px' }}>
                  {deptCourses.map(c => (
                    <button
                      key={c.id}
                      onClick={() => nav(`/levels/${c.id}`, { state: { courseName: c.title, courseCode: c.code } })}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '10px 12px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: `1px solid ${t.border}`,
                        color: t.text,
                        cursor: 'pointer',
                        fontSize: 14,
                        textAlign: 'left'
                      }}
                    >
                      {c.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Faculty