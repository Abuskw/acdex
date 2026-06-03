import { useState, useEffect } from 'react'

function Admin({ API, t, token, showToast }) {
  const [tab, setTab] = useState('analytics')
  const [users, setUsers] = useState([])
  const [lectures, setLectures] = useState([])
  const [reports, setReports] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(false)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchUsers = () => fetch(`${API}/api/admin/users`, { headers }).then(r => r.json()).then(setUsers)
  const fetchLectures = () => fetch(`${API}/api/admin/lectures`, { headers }).then(r => r.json()).then(setLectures)
  const fetchReports = () => fetch(`${API}/api/admin/reports`, { headers }).then(r => r.json()).then(setReports)
  const fetchAnalytics = () => fetch(`${API}/api/admin/analytics`, { headers }).then(r => r.json()).then(setAnalytics)

  const banUser = async (id, banned) => {
    await fetch(`${API}/api/admin/users/${id}/ban`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ banned }) })
    fetchUsers()
    showToast(banned ? 'User banned' : 'User unbanned')
  }

  const changeRole = async (id, role) => {
    await fetch(`${API}/api/admin/users/${id}/role`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) })
    fetchUsers()
    showToast('Role updated')
  }

  const deleteUser = async (id) => {
    if (!confirm('Delete user?')) return
    await fetch(`${API}/api/admin/users/${id}`, { method: 'DELETE', headers })
    fetchUsers()
  }

  const updateLectureStatus = async (id, status) => {
    await fetch(`${API}/api/admin/lectures/${id}/status`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    fetchLectures()
  }

  const deleteLecture = async (id) => {
    if (!confirm('Delete this lecture permanently? This will remove it from Cloudinary and delete all comments and ratings.')) return
    try {
      const res = await fetch(`${API}/api/admin/lectures/${id}/complete`, { method: 'DELETE', headers })
      if (res.ok) {
        showToast('Lecture permanently deleted')
        fetchLectures()
      } else {
        showToast('Failed to delete lecture', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    }
  }

  const dismissReport = async (id) => {
    await fetch(`${API}/api/admin/reports/${id}`, { method: 'DELETE', headers })
    fetchReports()
  }

  useEffect(() => {
    if (tab === 'users') fetchUsers()
    else if (tab === 'lectures') { fetchLectures(); fetchReports() }
    else if (tab === 'analytics') fetchAnalytics()
  }, [tab])

  const tabStyle = (name) => ({
    padding: '8px 14px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    background: tab === name ? t.accent : t.card,
    color: tab === name ? 'white' : t.text,
    fontWeight: tab === name ? 600 : 400,
    fontSize: 13,
    transition: 'all 0.2s'
  })

  return (
    <div className="fade-in" style={{ padding: 16 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Admin Panel</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {['analytics','users','lectures','reports'].map(name => (
          <button key={name} onClick={() => setTab(name)} style={tabStyle(name)}>
            {name === 'analytics' ? '📊 Analytics' :
             name === 'users' ? '👥 Users' :
             name === 'lectures' ? '📄 Content' :
             '🚩 Reports'}
          </button>
        ))}
      </div>

      {/* ANALYTICS */}
      {tab === 'analytics' && analytics && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Total Users', val: analytics.totalUsers, color: t.accent },
              { label: 'Courses', val: analytics.totalCourses, color: t.green },
              { label: 'Lectures', val: analytics.totalLectures, color: '#f59e0b' },
              { label: 'Downloads', val: analytics.totalDownloads, color: '#8b5cf6' },
              { label: 'Banned', val: analytics.totalBanned, color: t.red },
              { label: 'Flagged', val: analytics.flaggedLectures, color: '#ec4899' },
            ].map(s => (
              <div key={s.label} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 12, color: t.sub, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {analytics.topCourses && (
            <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Top Courses by Lectures</h3>
              {analytics.topCourses.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${t.border}` }}>
                  <span>{c.code} – {c.title}</span>
                  <span style={{ fontWeight: 600 }}>{c.lectureCount} lectures</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${t.border}` }}>
                <th style={{ padding: 8, textAlign: 'left' }}>Name</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Email</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Role</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Status</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                  <td style={{ padding: 8 }}>{u.fullName}</td>
                  <td style={{ padding: 8 }}>{u.email}</td>
                  <td style={{ padding: 8 }}>
                    <select value={u.role} onChange={e => changeRole(u.id, e.target.value)} style={{ padding: 4, borderRadius: 4, fontSize: 11 }}>
                      <option value="student">Student</option>
                      <option value="lecturer">Lecturer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ padding: 8 }}>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, background: u.banned ? t.red : t.green, color: 'white' }}>
                      {u.banned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td style={{ padding: 8, display: 'flex', gap: 4 }}>
                    <button onClick={() => banUser(u.id, u.banned ? 0 : 1)} style={{ padding: '4px 8px', borderRadius: 4, border: 'none', cursor: 'pointer', background: u.banned ? t.green : t.red, color: 'white', fontSize: 11 }}>
                      {u.banned ? 'Unban' : 'Ban'}
                    </button>
                    <button onClick={() => deleteUser(u.id)} style={{ padding: '4px 8px', borderRadius: 4, border: 'none', cursor: 'pointer', background: t.red, color: 'white', fontSize: 11 }}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* LECTURES */}
      {tab === 'lectures' && (
        <div>
          {lectures.map(l => (
            <div key={l.id} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: '10px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <strong>{l.title}</strong>
                <div style={{ fontSize: 12, color: t.sub }}>
                  {l.courseCode} · Week {l.weekNumber} · By {l.uploaderName}
                  {l.reportCount > 0 && <span style={{ color: t.red, marginLeft: 8 }}>🚩 {l.reportCount} reports</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <select value={l.status} onChange={e => updateLectureStatus(l.id, e.target.value)} style={{ padding: 4, borderRadius: 4, fontSize: 11 }}>
                  <option value="published">Published</option>
                  <option value="flagged">Flagged</option>
                  <option value="removed">Removed</option>
                </select>
                <button onClick={() => deleteLecture(l.id)} style={{ background: t.red, color: 'white', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>Del</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REPORTS */}
      {tab === 'reports' && (
        <div>
          {reports.length === 0 ? (
            <p style={{ color: t.sub, textAlign: 'center', padding: 20 }}>No reports</p>
          ) : (
            reports.map(r => (
              <div key={r.id} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <strong>{r.lectureTitle}</strong> ({r.courseCode})
                    <p style={{ margin: '4px 0', fontSize: 13 }}>Reported by: {r.reporterName} · Reason: {r.reason || 'N/A'}</p>
                  </div>
                  <button onClick={() => dismissReport(r.id)} style={{ background: t.accent, color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Dismiss</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default Admin