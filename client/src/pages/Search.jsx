import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Search({ API, t, setPdfUrl, setPdfTitle }) {
  const [query, setQuery] = useState('')
  const [allCourses, setAllCourses] = useState([])
  const [recentSearches, setRecentSearches] = useState(
    JSON.parse(localStorage.getItem('recentSearches') || '[]')
  )
  const [lectureResults, setLectureResults] = useState([])
  const nav = useNavigate()

  const [popularCourses, setPopularCourses] = useState([])

  useEffect(() => {
    fetch(`${API}/api/courses`).then(r => r.json()).then(setAllCourses).catch(() => {})
  }, [])

  useEffect(() => {
    setPopularCourses([...allCourses].sort(() => 0.5 - Math.random()).slice(0, 6))
  }, [allCourses])

  const suggestions = query.trim()
    ? allCourses.filter(
        c => c.title.toLowerCase().includes(query.toLowerCase()) || c.code.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : []

  const searchLectures = (term) => {
    if (!term.trim()) { setLectureResults([]); return }
    fetch(`${API}/api/courses`).then(r => r.json()).then(courses => {
      const results = []
      courses.forEach(c => {
        fetch(`${API}/api/courses/${c.id}/lectures`).then(r => r.json()).then(lectures => {
          const matches = lectures.filter(l => l.title.toLowerCase().includes(term.toLowerCase()))
          matches.forEach(l => {
            results.push({ ...l, courseCode: c.code, courseTitle: c.title, courseId: c.id })
          })
          setLectureResults(results.slice(0, 10))
        })
      })
    })
  }

  const handleSearch = (term) => {
    if (!term.trim()) return
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
    searchLectures(term)
  }

  const clearRecent = () => {
    setRecentSearches([])
    localStorage.removeItem('recentSearches')
  }

  

  return (
    <div className="fade-in" style={{ padding: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Search</h2>

      <div style={{ position: 'relative', marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search courses, lectures, topics..."
          value={query}
          onChange={e => { setQuery(e.target.value); handleSearch(e.target.value) }}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 10,
            border: `1px solid ${t.border}`, background: t.card, color: t.text, fontSize: 14, outline: 'none'
          }}
        />
        {query && (
          <button onClick={() => { setQuery(''); setLectureResults([]) }} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'transparent', border: 'none', color: t.sub, cursor: 'pointer', fontSize: 18
          }}>✕</button>
        )}
      </div>

      {/* When query is empty */}
      {!query.trim() && (
        <>
          {recentSearches.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: t.sub }}>Recent</h3>
                <button onClick={clearRecent} style={{ background: 'transparent', border: 'none', color: t.accent, fontSize: 12, cursor: 'pointer' }}>Clear</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {recentSearches.map((term, i) => (
                  <button key={i} onClick={() => { setQuery(term); handleSearch(term) }} style={{
                    background: t.card, border: `1px solid ${t.border}`, borderRadius: 20,
                    padding: '6px 14px', fontSize: 13, color: t.text, cursor: 'pointer'
                  }}>{term}</button>
                ))}
              </div>
            </div>
          )}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: t.sub, marginBottom: 10 }}>Popular Courses</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {popularCourses.map(c => (
                <button key={c.id} onClick={() => nav(`/course/${c.id}`)} style={{
                  background: t.card, border: `1px solid ${t.border}`, borderRadius: 10,
                  padding: '12px 14px', textAlign: 'left', color: t.text, cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 500 }}>{c.code} – {c.title}</span>
                  <span style={{ color: t.sub, fontSize: 12 }}>Level {c.level}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Course Suggestions */}
      {query.trim() && suggestions.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: t.sub, marginBottom: 8 }}>Courses</p>
          <div style={{ display: 'grid', gap: 8 }}>
            {suggestions.map(c => (
              <button key={c.id} onClick={() => nav(`/course/${c.id}`)} style={{
                background: t.card, border: `1px solid ${t.border}`, borderRadius: 10,
                padding: '12px 14px', textAlign: 'left', color: t.text, cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontWeight: 500 }}>{c.code} – {c.title}</span>
                <span style={{ color: t.sub, fontSize: 12 }}>Level {c.level}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lecture Results */}
      {query.trim() && lectureResults.length > 0 && (
        <div>
          <p style={{ fontSize: 12, color: t.sub, marginBottom: 8 }}>Lectures</p>
          <div style={{ display: 'grid', gap: 8 }}>
            {lectureResults.map((l, i) => (
              <button key={i} onClick={() => {
                if (typeof setPdfUrl === 'function') {
                  setPdfUrl(`${API}/api/lectures/${l.id}/view`)
                  if (typeof setPdfTitle === 'function') setPdfTitle(l.title)
                } else {
                  window.open(`${API}/api/lectures/${l.id}/view`, '_blank')
                }
              }} style={{
                background: t.card, border: `1px solid ${t.border}`, borderRadius: 10,
                padding: '12px 14px', textAlign: 'left', color: t.text, cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <strong style={{ fontSize: 13 }}>{l.title}</strong>
                  <p style={{ color: t.sub, fontSize: 11, margin: '2px 0' }}>{l.courseCode} – {l.courseTitle} • Week {l.weekNumber}</p>
                </div>
                <span style={{ color: t.accent, fontSize: 12 }}>View →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {query.trim() && suggestions.length === 0 && lectureResults.length === 0 && (
        <p style={{ color: t.sub, textAlign: 'center', padding: 40 }}>No results for "{query}"</p>
      )}
    </div>
  )
}

export default Search