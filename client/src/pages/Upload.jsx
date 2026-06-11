import { useState, useEffect } from 'react'

function Upload({ API, t, token, showToast }) {
  const [faculties, setFaculties] = useState([])
  const [depts, setDepts] = useState([])
  const [deptCourses, setDeptCourses] = useState([])
  const [fac, setFac] = useState('')
  const [dept, setDept] = useState('')
  const [course, setCourse] = useState('')
  const [title, setTitle] = useState('')
  const [week, setWeek] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [allCourses, setAllCourses] = useState([])
const [level, setLevel] = useState('')
  useEffect(() => {
    fetch(`${API}/api/faculties`).then(r => r.json()).then(setFaculties)
    fetch(`${API}/api/courses`).then(r => r.json()).then(setAllCourses)
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

  const handleDept = (id) => {
    setDept(id)
    setCourse('')
    setDeptCourses(allCourses.filter(c => c.departmentId == id))
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return showToast('Select a PDF', 'error')
    if (!course) return showToast('Select a course', 'error')
    if (!title || !week) return showToast('Fill all fields', 'error')

    setUploading(true)
    const fd = new FormData()
    fd.append('pdf', file)
    fd.append('title', title)
    fd.append('weekNumber', week)
    fd.append('courseId', course)
    fd.append('academicYear', '2024/2025')
fd.append('level', level)
    try {
      const res = await fetch(`${API}/api/lectures/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      })
      if (res.ok) {
        showToast('Uploaded successfully!')
        setTitle('')
        setWeek('')
        setFile(null)
        setFac('')
        setDept('')
        setCourse('')
      } else {
        const d = await res.json()
        showToast(d.error || 'Upload failed', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    }
    setUploading(false)
  }

  const selectedCourseName = deptCourses.find(c => c.id == course)?.title || ''

  return (
    <div className="fade-in" style={{ padding: 16, maxWidth: 400, margin: '0 auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Upload Lecture</h2>

      <form onSubmit={handleUpload} style={{ display: 'grid', gap: 12 }}>
        {/* Faculty */}
        <div>
          <label style={{ fontSize: 13, color: t.sub, marginBottom: 4, display: 'block' }}>Faculty</label>
          <select value={fac} onChange={e => handleFac(e.target.value)} style={{
            width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, background: t.card, color: t.text
          }}>
            <option value="">Select Faculty</option>
            {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>

        {/* Department */}
        <div>
          <label style={{ fontSize: 13, color: t.sub, marginBottom: 4, display: 'block' }}>Department</label>
          <select value={dept} onChange={e => handleDept(e.target.value)} disabled={!fac} style={{
            width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, background: t.card, color: t.text
          }}>
            <option value="">Select Department</option>
            {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        {/* Course */}
        <div>
          <label style={{ fontSize: 13, color: t.sub, marginBottom: 4, display: 'block' }}>Course of Study</label>
          <select value={course} onChange={e => setCourse(e.target.value)} disabled={!dept} style={{
            width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, background: t.card, color: t.text
          }}>
            <option value="">Select Course</option>
            {deptCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          {course && <p style={{ fontSize: 12, color: t.sub, marginTop: 4 }}>Selected: {selectedCourseName}</p>}
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${t.border}` }} />
{/* Level */}
<div>
  <label style={{ fontSize: 13, color: t.sub, marginBottom: 4, display: 'block' }}>Level</label>
  <select value={level} onChange={e => setLevel(e.target.value)} disabled={!course} style={{
    width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, background: t.card, color: t.text
  }}>
    <option value="">Select Level</option>
    <option value="100">100 Level</option>
    <option value="200">200 Level</option>
    <option value="300">300 Level</option>
    <option value="400">400 Level</option>
  </select>
</div>
        {/* Lecture Details */}
        <div>
          <label style={{ fontSize: 13, color: t.sub, marginBottom: 4, display: 'block' }}>Lecture Title</label>
          <input placeholder="e.g., Introduction to Anatomy" value={title} onChange={e => setTitle(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, background: t.card, color: t.text }} required />
        </div>

        <div>
          <label style={{ fontSize: 13, color: t.sub, marginBottom: 4, display: 'block' }}>Week Number</label>
          <input type="number" placeholder="e.g., 1" value={week} onChange={e => setWeek(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, background: t.card, color: t.text }} required />
        </div>

        <div>
          <label style={{ fontSize: 13, color: t.sub, marginBottom: 4, display: 'block' }}>PDF File</label>
          <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])}
            style={{ color: t.text }} required />
          {file && <p style={{ fontSize: 12, color: t.sub, marginTop: 4 }}>{file.name}</p>}
        </div>

        <button type="submit" disabled={uploading} style={{
          background: uploading ? t.border : t.accent,
          color: 'white', border: 'none', padding: 14, borderRadius: 8,
          fontSize: 16, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer', marginTop: 8
        }}>
          {uploading ? 'Uploading...' : 'Upload PDF'}
        </button>
      </form>
    </div>
  )
}

export default Upload