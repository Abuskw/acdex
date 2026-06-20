import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import BottomSheet from '../components/BottomSheet'

function Level({ API, t, showToast, setPdfUrl, setPdfTitle, user }) {
  const { courseId, level } = useParams()
  const nav = useNavigate()
  const [course, setCourse] = useState(null)
  const [lectures, setLectures] = useState([])
  const [loading, setLoading] = useState(true)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [commentCount, setCommentCount] = useState(0)
  const [replyTo, setReplyTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`${API}/api/courses/${courseId}`)
      .then(r => r.json())
      .then(data => setCourse(data))
      .catch(() => {})
    
    fetch(`${API}/api/courses/${courseId}/lectures`)
      .then(r => r.json())
      .then(data => {
        setLectures(data)
        setLoading(false)
        if (data.length > 0) {
          fetch(`${API}/api/lectures/${data[0].id}/comments`)
            .then(r => r.json())
            .then(d => setCommentCount(d.length))
        }
      })
      .catch(() => setLoading(false))
  }, [courseId, level])

  const loadComments = async () => {
    if (lectures.length > 0) {
      const res = await fetch(`${API}/api/lectures/${lectures[0].id}/comments`)
      const data = await res.json()
      setComments(data)
      setCommentCount(data.length)
    }
  }

  const submitComment = async () => {
    if (!commentText.trim() || lectures.length === 0) return
    const token = localStorage.getItem('token')
    const res = await fetch(`${API}/api/lectures/${lectures[0].id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text: commentText })
    })
    if (res.ok) { setCommentText(''); loadComments(); showToast('Comment added') }
  }

  const submitReply = async (parentId) => {
    if (!replyText.trim()) return
    const token = localStorage.getItem('token')
    const res = await fetch(`${API}/api/lectures/${lectures[0].id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text: replyText, parentId })
    })
    if (res.ok) { setReplyText(''); setReplyTo(null); loadComments(); showToast('Reply added') }
  }

  const handleView = (lecture) => {
    setPdfUrl(`${API}/api/lectures/${lecture.id}/view`)
    setPdfTitle(lecture.title)
  }

  const handleDownload = (lecture) => {
    window.open(`${API}/api/lectures/${lecture.id}/download`, '_blank')
    const dl = JSON.parse(localStorage.getItem('dl') || '[]')
    dl.unshift({ title: lecture.title, code: course?.code || '', week: lecture.weekNumber, date: new Date().toLocaleDateString() })
    localStorage.setItem('dl', JSON.stringify(dl.slice(0, 50)))
  }

  if (loading) return <div className="fade-in" style={{ padding: 16, textAlign: 'center', color: t.sub }}>Loading...</div>

  return (
    <div className="fade-in" style={{ padding: 16 }}>
      <button onClick={() => nav(-1)} style={{ background: 'transparent', border: 'none', color: t.accent, fontSize: 14, cursor: 'pointer', marginBottom: 16 }}>← Back</button>
      
      {course && (
        <div style={{ background: t.accent, color: 'white', padding: '14px 16px', borderRadius: 12, marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 4 }}>{course.code}</h2>
          <p style={{ fontSize: 14, opacity: 0.9 }}>{course.title} | {level} Level</p>
        </div>
      )}

      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Lectures ({lectures.length})</h3>

      {lectures.length === 0 ? (
        <p style={{ color: t.sub, textAlign: 'center', padding: 40 }}>No lectures for this course yet.</p>
      ) : (
        lectures.sort((a, b) => a.weekNumber - b.weekNumber).map(l => (
          <div key={l.id} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: '12px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <strong style={{ fontSize: 14 }}>Week {l.weekNumber}: {l.title}</strong>
              <div style={{ fontSize: 12, color: t.sub }}>{l.academicYear}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => handleView(l)} style={{ background: t.accent, color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>View</button>
              <button onClick={() => { if (!user) { showToast('Please login first', 'error'); nav('/settings'); return } handleDownload(l) }} style={{ background: t.green, color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Download</button>
              <button onClick={() => { if (!user) { showToast('Please login first', 'error'); nav('/settings'); return } const bm = JSON.parse(localStorage.getItem('bm') || '[]'); if (bm.find(b => b.title === l.title)) { showToast('Already saved'); return } bm.unshift({ title: l.title, code: course?.code, week: l.weekNumber }); localStorage.setItem('bm', JSON.stringify(bm.slice(0, 50))); showToast('Saved!') }} style={{ background: 'transparent', border: `1px solid ${t.border}`, color: t.text, padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        ))
      )}

      {/* Comments Button */}
      <div style={{ marginTop: 24 }}>
        <button onClick={() => { setShowComments(true); loadComments() }} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 8, padding: '8px 16px', cursor: 'pointer', color: t.text, fontSize: 14 }}>
          💬 Comments ({commentCount})
        </button>
      </div>

      {/* Bottom Sheet for Comments */}
      <BottomSheet open={showComments} onClose={() => { setShowComments(false); setReplyTo(null); setReplyText('') }} title="Discussion" t={t}>
        {user && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment…" style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, background: t.card, color: t.text }} onKeyPress={e => { if (e.key === 'Enter') submitComment() }} />
            <button onClick={submitComment} style={{ background: t.accent, color: 'white', border: 'none', padding: '10px 16px', borderRadius: 8, cursor: 'pointer' }}>Post</button>
          </div>
        )}
        {comments.length === 0 ? <p style={{ color: t.sub, textAlign: 'center', padding: 20 }}>No comments yet.</p> : comments.map(c => (
          <div key={c.id} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 8, padding: 10, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div><strong style={{ fontSize: 13 }}>{c.fullName}</strong><p style={{ margin: '4px 0', fontSize: 13 }}>{c.text}</p></div>
              <button onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyText('') }} style={{ background: 'transparent', border: 'none', color: t.accent, cursor: 'pointer', fontSize: 12, padding: '2px 8px', whiteSpace: 'nowrap' }}>{replyTo === c.id ? 'Cancel' : 'Reply'}</button>
            </div>
            {c.replies?.map(r => (
              <div key={r.id} style={{ marginLeft: 20, marginTop: 8, padding: '8px 10px', background: t.bg, borderRadius: 6, borderLeft: `3px solid ${t.accent}` }}>
                <strong style={{ fontSize: 12 }}>{r.fullName}</strong>
                <p style={{ margin: '2px 0', fontSize: 12 }}>{r.text}</p>
              </div>
            ))}
            {replyTo === c.id && (
              <div style={{ marginTop: 10, marginLeft: 20, display: 'flex', gap: 6 }}>
                <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write a reply..." autoFocus style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: `1px solid ${t.border}`, background: t.card, color: t.text, fontSize: 12 }} onKeyPress={e => { if (e.key === 'Enter') submitReply(c.id) }} />
                <button onClick={() => submitReply(c.id)} style={{ background: t.accent, color: 'white', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}>Reply</button>
              </div>
            )}
          </div>
        ))}
      </BottomSheet>
    </div>
  )
}

export default Level