import { useState, useEffect } from 'react'

function Upload({ API, t, token, showToast }) {
  const [faculties, setFaculties] = useState([])
  const [depts, setDepts] = useState([])
  const [courses, setCourses] = useState([])
  const [fac, setFac] = useState('')
  const [dept, setDept] = useState('')
  const [course, setCourse] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [level, setLevel] = useState('')
  const [title, setTitle] = useState('')
  const [week, setWeek] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API}/api/faculties`).then(r => r.json()).then(setFaculties)
    fetch(`${API}/api/courses`).then(r => r.json()).then(setCourses)
  }, [])

  const handleFac = (id) => {
    setFac(id)
    setDept('')
    setCourse('')
    if (id) {
      fetch(`${API}/api/faculties/${id}/departments`).then(r => r.json()).then(setDepts)
    } else {
      setDepts([])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return setError('Please select a PDF')
    if (!course) return setError('Please select a course')
    if (!courseCode) return setError('Please enter course code')
    if (!level) return setError('Please select a level')
    if (!token) { setError('Please login first'); return }
    
    setUploading(true)
    setError('')
    setMessage('')

    // Combine course code with lecture title
    const fullTitle = `${courseCode} - ${title}`

    const formData = new FormData()
    formData.append('pdf', file)
    formData.append('title', fullTitle)
    formData.append('weekNumber', week)
    formData.append('courseId', course)
    formData.append('academicYear', '2024/2025')

    try {
      const res = await fetch(`${API}/api/lectures/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        setMessage('Uploaded successfully!')
        setTitle('')
        setCourseCode('')
        setWeek('')
        setFile(null)
        setFac('')
        setDept('')
        setCourse('')
        setLevel('')
        showToast('Lecture uploaded!')
      } else {
        setError(data.error || 'Upload failed')
        showToast(data.error || 'Upload failed', 'error')
      }
    } catch {
      setError('Network error')
    }
    setUploading(false)
  }

  const deptCourses = courses.filter(c => c.departmentId == dept)

  return (
    <div className="fade-in" style={{ padding: 16, maxWidth: 400, margin: '0 auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Upload Lecture</h2>
      {message && <div style={{ background: '#dcfce7', color: '#16a34a', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 14 }}>{message}</div>}
      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 14 }}>{error}</div>}
      
      <form onSubmit={handleSubmit} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20, display: 'grid', gap: 12 }}>
        
        {/* Faculty */}
        <div>
          <label style={{ fontSize: 13, color: t.sub, marginBottom: 4, display: 'block' }}>Faculty *</label>
          <select value={fac} onChange={e => handleFac(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, background: t.card, color: t.text }}>
            <option value="">Select Faculty</option>
            {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>

        {/* Department */}
        <div>
          <label style={{ fontSize: 13, color: t.sub, marginBottom: 4, display: 'block' }}>Department *</label>
          <select value={dept} onChange={e => setDept(e.target.value)} disabled={!fac} required style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, background: t.card, color: t.text }}>
            <option value="">Select Department</option>
            {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        {/* Course Title (from seed data) */}
        <div>
          <label style={{ fontSize: 13, color: t.sub, marginBottom: 4, display: 'block' }}>Course of Study *</label>
          <select value={course} onChange={e => setCourse(e.target.value)} disabled={!dept} required style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, background: t.card, color: t.text }}>
            <option value="">Select Course</option>
            {deptCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>

        {/* Course Code (real code like CHM101) */}
        <div>
          <label style={{ fontSize: 13, color: t.sub, marginBottom: 4, display: 'block' }}>Course Code *</label>
          <input type="text" value={courseCode} onChange={e => setCourseCode(e.target.value.toUpperCase())}
            placeholder="e.g., CHM101" required
            style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, background: t.card, color: t.text }} />
        </div>

        {/* Level */}
        <div>
          <label style={{ fontSize: 13, color: t.sub, marginBottom: 4, display: 'block' }}>Level *</label>
          <select value={level} onChange={e => setLevel(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, background: t.card, color: t.text }}>
            <option value="">Select Level</option>
            <option value="100">100</option><option value="200">200</option><option value="300">300</option><option value="400">400</option>
          </select>
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${t.border}` }} />

        {/* Lecture Title */}
        <div>
          <label style={{ fontSize: 13, color: t.sub, marginBottom: 4, display: 'block' }}>Lecture Title *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
            placeholder="e.g., Introduction to Chemistry"
            style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, background: t.card, color: t.text }} />
          {courseCode && title && (
            <p style={{ fontSize: 11, color: t.sub, marginTop: 4 }}>Will save as: <strong>{courseCode} - {title}</strong></p>
          )}
        </div>

        {/* Week Number */}
        <div>
          <label style={{ fontSize: 13, color: t.sub, marginBottom: 4, display: 'block' }}>Week Number *</label>
          <input type="number" value={week} onChange={e => setWeek(e.target.value)} required
            placeholder="1" min="1" max="20"
            style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, background: t.card, color: t.text }} />
        </div>

        {/* PDF File */}
        <div>
          <label style={{ fontSize: 13, color: t.sub, marginBottom: 4, display: 'block' }}>PDF File *</label>
          <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} required style={{ color: t.text }} />
          {file && <p style={{ fontSize: 12, color: t.sub, marginTop: 4 }}>{file.name}</p>}
        </div>

        <button type="submit" disabled={uploading} style={{
          background: uploading ? t.border : t.accent, color: 'white', border: 'none',
          padding: 14, borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 8
        }}>
          {uploading ? 'Uploading...' : 'Upload Lecture'}
        </button>
      </form>
    </div>
  )
}

export default Upload