import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import BottomSheet from '../components/BottomSheet'

function Course({ API, t, user, showToast, setPdfUrl, setPdfTitle }) {
  const { id } = useParams()
  const nav = useNavigate()
  const [course, setCourse] = useState(null)
  const [lectures, setLectures] = useState([])
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [showComments, setShowComments] = useState(false)
  const [loading, setLoading] = useState(true)
  const [commentCount, setCommentCount] = useState(0)
const [replyTo, setReplyTo] = useState(null)
const [replyText, setReplyText] = useState('')
const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)

      try {
        const [courseRes, lecturesRes] = await Promise.all([
          fetch(`${API}/api/courses/${id}`).then(r => r.json()),
          fetch(`${API}/api/courses/${id}/lectures`).then(r => r.json())
        ])

        if (cancelled) return

        setCourse(courseRes)
        setLectures(lecturesRes)

        // Load comment count if lectures exist
        if (lecturesRes.length > 0) {
          const commentsRes = await fetch(`${API}/api/lectures/${lecturesRes[0].id}/comments`)
          const commentsData = await commentsRes.json()
          setCommentCount(commentsData.length)
        }
      } catch (err) {
        console.error('Failed to load course data', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [API, id])

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
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ text: commentText })
    })
    if (res.ok) {
      setCommentText('')
      await loadComments()
      showToast('Comment added')
    }
  }
const submitReply = async (parentId) => {
    if (!replyText.trim()) return
    const token = localStorage.getItem('token')
    const res = await fetch(`${API}/api/lectures/${lectures[0].id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ text: replyText, parentId })
    })
    if (res.ok) {
      setReplyText('')
      setReplyTo(null)
      loadComments()
      showToast('Reply added')
    }
  }
  const bookmark = (l) => {
    const bm = JSON.parse(localStorage.getItem('bm') || '[]')
    if (bm.find(b => b.title === l.title)) return
    bm.unshift({ title: l.title, code: course?.code, week: l.weekNumber })
    localStorage.setItem('bm', JSON.stringify(bm.slice(0, 50)))
    showToast('Bookmarked')
  }

  const handleView = (lecture) => {
    setPdfUrl(`${API}/api/lectures/${lecture.id}/view`)
    setPdfTitle(lecture.title)
  }

  const handleDownload = (lecture) => {
    window.open(`${API}/api/lectures/${lecture.id}/download`, '_blank')
    const dl = JSON.parse(localStorage.getItem('dl') || '[]')
    dl.unshift({
      title: lecture.title,
      code: course?.code,
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

      {course && (
        <div style={{
          background: t.accent,
          color: 'white',
          padding: '14px 16px',
          borderRadius: 12,
          marginBottom: 20
        }}>
          <h2 style={{ fontSize: 18, marginBottom: 4 }}>{course.code}</h2>
          <p style={{ fontSize: 14, opacity: 0.9 }}>
            {course.title} · Level {course.level} · Semester {course.semester}
          </p>
        </div>
      )}

      {lectures.length === 0 ? (
        <p style={{ color: t.sub, textAlign: 'center', padding: 20 }}>
          No lectures yet.
        </p>
      ) : (
        lectures.map(l => (
          <div
            key={l.id}
            style={{
              background: t.card,
              border: `1px solid ${t.border}`,
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 8
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8
            }}>
              <div>
                <strong style={{ fontSize: 14 }}>
                  Week {l.weekNumber}: {l.title}
                </strong>
                <div style={{ fontSize: 12, color: t.sub }}>
                  {l.academicYear} · {l.uploaderName}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => handleView(l)} style={{
                  background: t.accent, color: 'white', border: 'none',
                  padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer'
                }}>View</button>
                <button onClick={() => {
  if (!user) { setShowLoginPrompt(true); return }
  handleDownload(l)
}} style={{
  background: t.green, color: 'white', border: 'none',
  padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer'
}}>Download</button>
<button onClick={() => {
  if (!user) { setShowLoginPrompt(true); return }
  bookmark(l)
}} style={{
  background: 'transparent', border: `1px solid ${t.border}`,
  color: t.text, padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer'
}}>Save</button>
              </div>
            </div>
          </div>
        ))
      )}

            {/* Comments Button */}
      <div style={{ marginTop: 24 }}>
        <button
          onClick={() => {
            setShowComments(true)
            loadComments()
          }}
          style={{
            background: t.card,
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            padding: '8px 16px',
            cursor: 'pointer',
            color: t.text,
            fontSize: 14
          }}
        >
          💬 Comments ({commentCount})
        </button>
      </div>

      {/* Bottom Sheet for Comments */}
      <BottomSheet
        open={showComments}
        onClose={() => {
          setShowComments(false)
          setReplyTo(null)
          setReplyText('')
        }}
        title="Discussion"
        t={t}
      >
        {user && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Add a comment…"
              style={{
                flex: 1, padding: 10, borderRadius: 8,
                border: `1px solid ${t.border}`, background: t.card, color: t.text
              }}
              onKeyPress={e => {
                if (e.key === 'Enter') submitComment()
              }}
            />
            <button
              onClick={submitComment}
              style={{
                background: t.accent, color: 'white', border: 'none',
                padding: '10px 16px', borderRadius: 8, cursor: 'pointer'
              }}
            >Post</button>
          </div>
        )}

        {comments.length === 0 ? (
          <p style={{ color: t.sub, textAlign: 'center', padding: 20 }}>
            No comments yet. Be the first!
          </p>
        ) : (
          comments.map(c => (
            <div key={c.id} style={{
              background: t.card, border: `1px solid ${t.border}`,
              borderRadius: 8, padding: 10, marginBottom: 8
            }}>
              {/* Comment Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong style={{ fontSize: 13 }}>{c.fullName}</strong>
                  <p style={{ margin: '4px 0', fontSize: 13 }}>{c.text}</p>
                </div>
                <button
                  onClick={() => {
                    setReplyTo(replyTo === c.id ? null : c.id)
                    setReplyText('')
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: t.accent,
                    cursor: 'pointer',
                    fontSize: 12,
                    padding: '2px 8px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {replyTo === c.id ? 'Cancel' : 'Reply'}
                </button>
              </div>

              {/* Existing Replies */}
              {c.replies?.map(r => (
                <div key={r.id} style={{
                  marginLeft: 20, marginTop: 8, padding: '8px 10px',
                  background: t.bg, borderRadius: 6,
                  borderLeft: `3px solid ${t.accent}`
                }}>
                  <strong style={{ fontSize: 12 }}>{r.fullName}</strong>
                  <p style={{ margin: '2px 0', fontSize: 12 }}>{r.text}</p>
                </div>
              ))}

              {/* Reply Input */}
              {replyTo === c.id && (
                <div style={{ marginTop: 10, marginLeft: 20, display: 'flex', gap: 6 }}>
                  <input
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    autoFocus
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: `1px solid ${t.border}`,
                      background: t.card,
                      color: t.text,
                      fontSize: 12
                    }}
                    onKeyPress={e => {
                      if (e.key === 'Enter') submitReply(c.id)
                    }}
                  />
                  <button
                    onClick={() => submitReply(c.id)}
                    style={{
                      background: t.accent,
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 12,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Reply
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </BottomSheet>
      {/* Login Prompt Modal */}
{showLoginPrompt && (
  <div onClick={() => setShowLoginPrompt(false)} style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
  }}>
    <div onClick={e => e.stopPropagation()} style={{
      background: t.card, padding: 28, borderRadius: 16, textAlign: 'center', maxWidth: 320, width: '100%',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)', animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
      <h3 style={{ marginBottom: 8, fontSize: 18 }}>Login Required</h3>
      <p style={{ color: t.sub, fontSize: 13, marginBottom: 20 }}>
        You need to login to download lectures and save bookmarks.
      </p>
      <button onClick={() => { setShowLoginPrompt(false); nav('/settings') }} style={{
        background: t.accent, color: 'white', border: 'none', padding: '12px 24px',
        borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600, width: '100%'
      }}>
        Go to Login
      </button>
      <button onClick={() => setShowLoginPrompt(false)} style={{
        background: 'transparent', border: 'none', color: t.sub,
        padding: '10px', cursor: 'pointer', marginTop: 8, fontSize: 13
      }}>
        Cancel
      </button>
    </div>
  </div>
)}
    </div>
  )
}

export default Course