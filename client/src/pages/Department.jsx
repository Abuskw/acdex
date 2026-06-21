import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'

function Department({ API, t, showToast, setPdfUrl, setPdfTitle, user }) {
  const { id } = useParams()
  const nav = useNavigate()
  const location = useLocation()
  const { deptName, facultyName, facultyId } = location.state || {}
  const [courses, setCourses] = useState([])
  const [lectures, setLectures] = useState([])
  const [expandedCourse, setExpandedCourse] = useState(null)
  const [selectedLevel, setSelectedLevel] = useState(null)

  useEffect(() => {
    fetch(`${API}/api/courses`).then(r => r.json()).then(d =>
      setCourses(d.filter(c => c.departmentId == id))
    )
  }, [id])

  const loadLectures = (courseId) => {
    fetch(`${API}/api/courses/${courseId}/lectures`).then(r => r.json()).then(data => {
      setLectures(prev => {
        const without = prev.filter(l => l.courseId !== courseId)
        return [...without, ...data.map(l => ({...l, courseId}))]
      })
    })
  }

  const handleView = (lecture) => {
    setPdfUrl(`${API}/api/lectures/${lecture.id}/view`)
    setPdfTitle(lecture.title)
  }

  const levels = [100, 200, 300, 400]

  return (
    <div className="fade-in" style={{ padding: 16 }}>
      <Breadcrumbs t={t} items={[
        { label: 'Home', path: '/' },
        { label: facultyName || 'Faculty', path: facultyId ? `/faculty/${facultyId}` : null },
        { label: deptName || 'Department' }
      ]} />

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{deptName}</h2>
      
      {/* Level Tabs */}
      <div style={{ display: 'flex', gap: 6, margin: '16px 0', flexWrap: 'wrap' }}>
        {levels.map(l => (
          <button key={l} onClick={() => setSelectedLevel(l)} style={{
            padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: selectedLevel === l ? t.accent : t.card,
            color: selectedLevel === l ? 'white' : t.text,
            fontSize: 13, fontWeight: 500
          }}>
            {l} Level
          </button>
        ))}
      </div>

      {/* Courses for selected level */}
      {selectedLevel && (
        <div>
          {courses.filter(c => c.level === selectedLevel).map(course => {
            const courseLecs = lectures.filter(l => l.courseId === course.id)
            const isOpen = expandedCourse === course.id
            return (
              <div key={course.id} style={{ marginBottom: 8 }}>
                <button onClick={() => {
                  if (!isOpen) loadLectures(course.id)
                  setExpandedCourse(isOpen ? null : course.id)
                }} style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10,
                  background: isOpen ? t.accent : t.card,
                  border: `1px solid ${t.border}`, color: isOpen ? 'white' : t.text,
                  cursor: 'pointer', fontSize: 14, fontWeight: 600, textAlign: 'left',
                  display: 'flex', justifyContent: 'space-between'
                }}>
                  <span>{course.code} - {course.title}</span>
                  <span>{isOpen ? '▲' : '▼'}</span>
                </button>
                {isOpen && (
                  <div style={{ padding: '8px 0' }}>
                    {courseLecs.length === 0 ? (
                      <p style={{ color: t.sub, fontSize: 13, padding: 8 }}>No lectures yet</p>
                    ) : (
                      courseLecs.sort((a,b) => a.weekNumber - b.weekNumber).map(l => (
                        <div key={l.id} style={{ padding: '8px 12px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ fontSize: 13 }}>Week {l.weekNumber}: {l.title}</strong>
                          </div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => handleView(l)} style={{ background: t.accent, color: 'white', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>View</button>
                            <button onClick={() => window.open(`${API}/api/lectures/${l.id}/download`, '_blank')} style={{ background: t.green, color: 'white', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>Download</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Department