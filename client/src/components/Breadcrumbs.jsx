import { useNavigate } from 'react-router-dom'

function Breadcrumbs({ items, t }) {
  const nav = useNavigate()

  return (
    <nav style={{ marginBottom: 16, fontSize: 13, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {i > 0 && <span style={{ color: t.sub, margin: '0 2px' }}>/</span>}
          {item.path ? (
            <button
              onClick={() => nav(item.path)}
              style={{
                background: 'transparent',
                border: 'none',
                color: t.accent,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: i === items.length - 1 ? 600 : 400,
                textDecoration: 'none',
                padding: 0
              }}
            >
              {item.label}
            </button>
          ) : (
            <span style={{ color: i === items.length - 1 ? t.text : t.sub, fontWeight: i === items.length - 1 ? 600 : 400 }}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}

export default Breadcrumbs