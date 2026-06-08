import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

function Level({ API, t, showToast, setPdfUrl, setPdfTitle }) {
  const { deptId, level } = useParams()
  const nav = useNavigate()
  const [courses, setCourses] = useState([])
  const [lectures, setLectures] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setLectures([])
    fetch(`${API}/api/courses`)
      .then(r => r.json())
      .then(data => {
        const filtered = data.filter(c => c.departmentId == deptId && c.level == level)
        setCourses(filtered)
        if (filtered.length === 0) {
          setLoading(false)
          return
        }
        let loaded = 0
        filtered.forEach(c => {
          fetch(`${API}/api/courses/${c.id}/lectures`)
            .then(r => r.json())
            .then(lec => {
              setLectures(prev => {
                const without = prev.filter(l => l.courseId !== c.id)
                return [...without, ...lec.map(l => ({ ...l, courseId: c.id, courseCode: c.code }))]
              })
              loaded++
              if (loaded >= filtered.length) setLoading(false)
            })
            .catch(() => {
              loaded++
              if (loaded >= filtered.length) setLoading(false)
            })
        })
      })
      .catch(() => setLoading(false))
  }, [deptId, level])

  const handleView = (lecture) => {
    setPdfUrl(`${API}/api/lectures/${lecture.id}/view`)
    setPdfTitle(lecture.title)
  }

  const handleDownload = (lecture, course) => {
    window.open(`${API}/api/lectures/${lecture.id}/download`, '_blank')
    const dl = JSON.parse(localStorage.getItem('dl') || '[]')
    dl.unshift({
      title: lecture.title,
      code: course.code,
      week: lecture.weekNumber,
      date: new Date().toLocaleDateString()
    })
    localStorage.setItem('dl', JSON.stringify(dl.slice(0, 50)))
  }

  if (loading) {
    return (
      <div className="fade-in" style={{ padding: 16, textAlign: 'center', color: t.sub }}>
        Loading…
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ padding: 16 }}>
      <button
        onClick={() => nav(-1)}
        style={{
          background: 'transparent', border: 'none', color: t.accent,
          fontSize: 14, cursor: 'pointer', marginBottom: 16
        }}
      >
        ← Back
      </button>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
        {level} Level Courses
      </h2>

      {courses.length === 0 ? (
        <p style={{ color: t.sub, textAlign: 'center', padding: 40 }}>
          No courses for this level yet.
        </p>
      ) : (
        courses.map(course => {
          const courseLecs = lectures.filter(l => l.courseId === course.id)
          return (
            <div key={course.id} style={{ marginBottom: 24 }}>
              <div
                style={{
                  background: t.accent,
                  color: 'white',
                  padding: '10px 14px',
                  borderRadius: 10,
                  marginBottom: 8
                }}
              >
                <strong>{course.code}</strong> – {course.title}
              </div>

              {courseLecs.length === 0 ? (
                <div style={{ padding: 12, color: t.sub, fontSize: 13, fontStyle: 'italic' }}>
                  No lectures yet
                </div>
              ) : (
                courseLecs
                  .sort((a, b) => a.weekNumber - b.weekNumber)
                  .map(l => (
                    <div
                      key={l.id}
                      style={{
                        background: t.card,
                        border: `1px solid ${t.border}`,
                        borderRadius: 10,
                        padding: '10px 14px',
                        marginBottom: 6,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: 14 }}>
                          Week {l.weekNumber}: {l.title}
                        </strong>
                        <div style={{ fontSize: 12, color: t.sub }}>
                          {l.academicYear}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleView(l)}
                          style={{
                            background: t.accent,
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: 6,
                            fontSize: 12,
                            cursor: 'pointer'
                          }}
                        >
                          View
                        </button>
                       <button onClick={() => {
  if (!user) { showToast('Please login first', 'error'); nav('/settings'); return }
  handleDownload(l)
}} style={{
  background: t.green, color: 'white', border: 'none',
  padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer'
}}>Download</button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

export default Level