import { useState } from 'react'

function PDFViewer({ url, title, onClose }) {
  const [zoom, setZoom] = useState(100)
  const [failed, setFailed] = useState(false)

  if (!url) return null

  const zoomIn = () => setZoom(z => Math.min(z + 25, 200))
  const zoomOut = () => setZoom(z => Math.max(z - 25, 50))

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#0f172a', zIndex: 9999,
      display: 'flex', flexDirection: 'column'
    }}>
      {/* Top Bar */}
      <div style={{
        background: '#1e3a5f', color: 'white', padding: '10px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 8
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
              padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14,
              fontWeight: 500
            }}
          >
            ← Back
          </button>
          <span style={{ fontWeight: 600, fontSize: 14, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title || 'PDF'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {/* Zoom controls */}
          <button
            onClick={zoomOut}
            disabled={zoom <= 50}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
              padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 14,
              opacity: zoom <= 50 ? 0.4 : 1
            }}
          >
            −
          </button>
          <span style={{ fontSize: 12, minWidth: 45, textAlign: 'center', fontWeight: 500 }}>
            {zoom}%
          </span>
          <button
            onClick={zoomIn}
            disabled={zoom >= 200}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
              padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 14,
              opacity: zoom >= 200 ? 0.4 : 1
            }}
          >
            +
          </button>

          <span style={{ margin: '0 4px', color: 'rgba(255,255,255,0.3)' }}>|</span>

          {/* Download */}
          <a
            href={url}
            download
            style={{
              background: '#3b82f6', color: 'white', border: 'none',
              padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
              fontSize: 13, fontWeight: 500, textDecoration: 'none'
            }}
          >
            Download
          </a>
        </div>
      </div>

      {/* PDF Content */}
      <div style={{
        flex: 1, background: '#1e293b',
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        overflow: 'auto', padding: 16
      }}>
        {failed ? (
          <div style={{ color: 'white', textAlign: 'center', padding: 40, alignSelf: 'center' }}>
            <p style={{ fontSize: 16, marginBottom: 16 }}>Cannot display this PDF</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#3b82f6', color: 'white', padding: '10px 20px',
                borderRadius: 8, textDecoration: 'none', display: 'inline-block'
              }}
            >
              Open in New Tab
            </a>
          </div>
        ) : (
          <iframe
            src={url}
            style={{
              width: `${zoom}%`,
              maxWidth: '100%',
              height: '100%',
              minHeight: '80vh',
              border: 'none',
              borderRadius: 8,
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              transition: 'width 0.2s ease',
              background: 'white'
            }}
            onError={() => setFailed(true)}
            title="PDF Viewer"
          />
        )}
      </div>

      {/* Bottom hint */}
      <div style={{
        background: '#1e3a5f', color: 'rgba(255,255,255,0.6)',
        textAlign: 'center', padding: '6px', fontSize: 11
      }}>
        Pinch to zoom on mobile · Scroll to navigate
      </div>
    </div>
  )
}

export default PDFViewer