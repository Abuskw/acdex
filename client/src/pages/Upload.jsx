import { useState, useEffect } from 'react'

function Upload({ API, t, token, showToast }) {
  const [faculties, setFaculties] = useState([])
  const [depts, setDepts] = useState([])
  const [fac, setFac] = useState('')
  const [dept, setDept] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [courseTitle, setCourseTitle] = useState('')
  const [title, setTitle] = useState('')
  const [week, setWeek] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/faculties`)
      .then(r => r.json())
      .then(setFaculties)
  }, [])

  const handleFac = (id) => {
    setFac(id)
    setDept('')
    if (id) {
      fetch(`${API}/api/faculties/${id}/departments`)
        .then(r => r.json())
        .then(setDepts)
    } else {
      setDepts([])
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return showToast('Choose a PDF', 'error')
    if (!courseCode || !courseTitle) return showToast('Enter course code and title', 'error')
    if (!title || !week) return showToast('Fill all lecture details', 'error')

    setUploading(true)

    // 1️⃣ Create or get course
    let courseId
    try {
      const courseRes = await fetch(`${API}/api/courses/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: courseCode.toUpperCase(),
          title: courseTitle,
          departmentId: dept
        })
      })
      const courseData = await courseRes.json()
      courseId = courseData.id
    } catch (err) {
      showToast('Failed to create course', 'error')
      setUploading(false)
      return
    }

    // 2️⃣ Upload PDF
    const fd = new FormData()
    fd.append('pdf', file)
    fd.append('title', title)
    fd.append('weekNumber', week)
    fd.append('courseId', courseId)
    fd.append('academicYear', '2024/2025')

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
        setCourseCode('')
        setCourseTitle('')
        setFac('')
        setDept('')
      } else {
        const d = await res.json()
        showToast(d.error || 'Upload failed', 'error')
      }
    } catch (err) {
      showToast('Network error', 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fade-in" style={{ padding: 16, maxWidth: 420, margin: '0 auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Upload Lecture</h2>

      <form onSubmit={handleUpload} style={{ display: 'grid', gap: 14 }}>
        {/* Faculty */}
        <div>
          <label style={{ fontSize: 13, color: t.sub, marginBottom: 4, display: 'block' }}>Faculty</label>
          <select value={fac} onChange={e => handleFac(e.target.value)} style={{
            width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${t.border}`,
            background: t.card, color: t.text
          }}>
            <option value="">Select Faculty</option>
            {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>

        {/* Department */}
        <div>
          <label style={{ fontSize: 13, color: t.sub, marginBottom: 4, display: 'block' }}>Department</label>
          <select value={dept} onChange={e => setDept(e.target.value)} disabled={!fac} style={{
            width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${t.border}`,
            background: t.card, color: t.text
          }}>
            <option value="">Select Department</option>
            {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        {/* Course Code & Title */}
        <div style={{ display: 'grid', gap: 8 }}>
          <label style={{ fontSize: 13, color: t.sub }}>Course</label>
          <input
            placeholder="Course Code (e.g. CSC401)"
            value={courseCode}
            onChange={e => setCourseCode(e.target.value.toUpperCase())}
            style={{
              padding: 10, borderRadius: 8, border: `1px solid ${t.border}`,
              background: t.card, color: t.text
            }}
          />
          <input
            placeholder="Course Title (e.g. Artificial Intelligence)"
            value={courseTitle}
            onChange={e => setCourseTitle(e.target.value)}
            style={{
              padding: 10, borderRadius: 8, border: `1px solid ${t.border}`,
              background: t.card, color: t.text
            }}
          />
        </div>

        <hr style={{ border: 'none', borderTop: `1px solid ${t.border}`, margin: '4px 0' }} />

        {/* Lecture Details */}
        <div style={{ display: 'grid', gap: 8 }}>
          <label style={{ fontSize: 13, color: t.sub }}>Lecture Details</label>
          <input
            placeholder="Lecture Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{
              padding: 10, borderRadius: 8, border: `1px solid ${t.border}`,
              background: t.card, color: t.text
            }}
          />
          <input
            type="number"
            placeholder="Week Number"
            value={week}
            onChange={e => setWeek(e.target.value)}
            style={{
              padding: 10, borderRadius: 8, border: `1px solid ${t.border}`,
              background: t.card, color: t.text
            }}
          />
          <input
            type="file"
            accept=".pdf"
            onChange={e => setFile(e.target.files[0])}
            style={{ color: t.text }}
          />
          {file && (
            <p style={{ fontSize: 12, color: t.sub }}>
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={uploading}
          style={{
            background: uploading ? t.border : t.accent,
            color: 'white',
            border: 'none',
            padding: 14,
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: uploading ? 'not-allowed' : 'pointer',
            marginTop: 8
          }}
        >
          {uploading ? 'Uploading…' : 'Upload PDF'}
        </button>
      </form>
    </div>
  )
}

export default Upload