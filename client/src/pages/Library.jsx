import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Library({ t }) {
  const nav = useNavigate()
  const [downloads, setDownloads] = useState([])
  const [bookmarks, setBookmarks] = useState([])

  useEffect(() => {
    setDownloads(JSON.parse(localStorage.getItem('dl') || '[]'))
    setBookmarks(JSON.parse(localStorage.getItem('bm') || '[]'))
  }, [])

  const removeDownload = (i) => {
    const d = downloads.filter((_, j) => j !== i)
    setDownloads(d)
    localStorage.setItem('dl', JSON.stringify(d))
  }

  const removeBookmark = (i) => {
    const b = bookmarks.filter((_, j) => j !== i)
    setBookmarks(b)
    localStorage.setItem('bm', JSON.stringify(b))
  }

  return (
    <div className="fade-in" style={{ padding: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>My Library</h2>

      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: t.sub }}>Downloads</h3>
      {downloads.length === 0 ? (
        <p style={{ color: t.sub, fontSize: 13, marginBottom: 24 }}>No downloads yet</p>
      ) : (
        downloads.map((d, i) => (
          <div key={i} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: '10px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: 14 }}>{d.title}</strong>
              <div style={{ fontSize: 12, color: t.sub }}>{d.code} | Week {d.week} | {d.date}</div>
            </div>
            <button onClick={() => removeDownload(i)} style={{ background: t.red, color: 'white', border: 'none', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Remove</button>
          </div>
        ))
      )}

      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, marginTop: 24, color: t.sub }}>Bookmarks</h3>
      {bookmarks.length === 0 ? (
        <p style={{ color: t.sub, fontSize: 13 }}>No bookmarks yet</p>
      ) : (
        bookmarks.map((b, i) => (
          <div key={i} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: '10px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: 14 }}>{b.title}</strong>
              <div style={{ fontSize: 12, color: t.sub }}>{b.code} | Week {b.week}</div>
            </div>
            <button onClick={() => removeBookmark(i)} style={{ background: t.red, color: 'white', border: 'none', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Remove</button>
          </div>
        ))
      )}
    </div>
  )
}

export default Library