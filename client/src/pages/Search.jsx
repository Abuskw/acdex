import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Search({ API, t }) {
  const [query, setQuery] = useState('')
  const [allCourses, setAllCourses] = useState([])
  const [recentSearches, setRecentSearches] = useState(
    JSON.parse(localStorage.getItem('recentSearches') || '[]')
  )
  const nav = useNavigate()

  // Load all courses on mount
  useEffect(() => {
    fetch(`${API}/api/courses`)
      .then(r => r.json())
      .then(data => setAllCourses(data))
      .catch(() => {})
  }, [])

  // Filtered suggestions based on query
  const suggestions = query.trim()
    ? allCourses.filter(
        c =>
          c.title.toLowerCase().includes(query.toLowerCase()) ||
          c.code.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : []

  // Popular/trending courses (random 6 from all)
  const popularCourses = [...allCourses]
    .sort(() => 0.5 - Math.random())
    .slice(0, 6)

  // Handle search: save to recent searches
  const handleSearch = (term) => {
    if (!term.trim()) return
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  const clearRecent = () => {
    setRecentSearches([])
    localStorage.removeItem('recentSearches')
  }

  return (
    <div className="fade-in" style={{ padding: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Search Courses</h2>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search by course code or title..."
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            handleSearch(e.target.value)
          }}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 10,
            border: `1px solid ${t.border}`,
            background: t.card,
            color: t.text,
            fontSize: 14,
            outline: 'none'
          }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              color: t.sub,
              cursor: 'pointer',
              fontSize: 18
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* When query is empty: show popular + recent */}
      {!query.trim() && (
        <>
          {recentSearches.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: t.sub }}>Recent Searches</h3>
                <button
                  onClick={clearRecent}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: t.accent,
                    fontSize: 12,
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {recentSearches.map((term, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuery(term)
                      handleSearch(term)
                    }}
                    style={{
                      background: t.card,
                      border: `1px solid ${t.border}`,
                      borderRadius: 20,
                      padding: '6px 14px',
                      fontSize: 13,
                      color: t.text,
                      cursor: 'pointer'
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: t.sub, marginBottom: 10 }}>
              Popular Courses
            </h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {popularCourses.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setQuery(c.code)
                    nav(`/course/${c.id}`)
                  }}
                  style={{
                    background: t.card,
                    border: `1px solid ${t.border}`,
                    borderRadius: 10,
                    padding: '12px 14px',
                    textAlign: 'left',
                    color: t.text,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontWeight: 500 }}>
                    {c.code} – {c.title}
                  </span>
                  <span style={{ color: t.sub, fontSize: 12 }}>Level {c.level}</span>
                </button>
              ))}
              {popularCourses.length === 0 && (
                <p style={{ color: t.sub, fontSize: 13, textAlign: 'center', padding: 20 }}>
                  No courses available yet.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* When query is typed: show live suggestions */}
      {query.trim() && suggestions.length > 0 && (
        <div>
          <p style={{ fontSize: 12, color: t.sub, marginBottom: 8 }}>
            {suggestions.length} results for "{query}"
          </p>
          <div style={{ display: 'grid', gap: 8 }}>
            {suggestions.map(c => (
              <button
                key={c.id}
                onClick={() => nav(`/course/${c.id}`)}
                style={{
                  background: t.card,
                  border: `1px solid ${t.border}`,
                  borderRadius: 10,
                  padding: '12px 14px',
                  textAlign: 'left',
                  color: t.text,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontWeight: 500 }}>
                  {c.code} – {c.title}
                </span>
                <span style={{ color: t.sub, fontSize: 12 }}>Level {c.level}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {query.trim() && suggestions.length === 0 && (
        <p style={{ color: t.sub, textAlign: 'center', padding: 20 }}>
          No courses found for "{query}".
        </p>
      )}
    </div>
  )
}

export default Search