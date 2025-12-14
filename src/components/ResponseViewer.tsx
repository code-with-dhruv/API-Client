import { useState } from 'react'
import { CheckCircle, XCircle, Clock, FileText } from 'lucide-react'
import { Response } from '../types'
import './ResponseViewer.css'

interface ResponseViewerProps {
  response: Response | null
}

export default function ResponseViewer({ response }: ResponseViewerProps) {
  const [activeTab, setActiveTab] = useState<'body' | 'headers'>('body')
  const [bodyView, setBodyView] = useState<'pretty' | 'raw'>('pretty')

  if (!response) {
    return (
      <div className="response-viewer empty">
        <div className="empty-state">
          <FileText size={64} />
          <p>Send a request to see the response</p>
        </div>
      </div>
    )
  }

  const isSuccess = response.status >= 200 && response.status < 300
  const isError = response.status >= 400

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const formatBody = () => {
    if (typeof response.data === 'string') {
      return response.data
    }
    try {
      return JSON.stringify(response.data, null, 2)
    } catch {
      return String(response.data)
    }
  }

  return (
    <div className="response-viewer">
      <div className="response-status-bar">
        <div className="status-info">
          {isSuccess ? (
            <CheckCircle size={16} className="status-icon success" />
          ) : (
            <XCircle size={16} className="status-icon error" />
          )}
          <span className={`status-code ${isError ? 'error' : isSuccess ? 'success' : ''}`}>
            {response.status} {response.statusText}
          </span>
        </div>
        <div className="response-meta">
          <div className="meta-item">
            <Clock size={14} />
            <span>{response.time}ms</span>
          </div>
          <div className="meta-item">
            <FileText size={14} />
            <span>{formatSize(response.size)}</span>
          </div>
        </div>
      </div>

      <div className="response-tabs">
        <button
          className={`tab ${activeTab === 'body' ? 'active' : ''}`}
          onClick={() => setActiveTab('body')}
        >
          Body
        </button>
        <button
          className={`tab ${activeTab === 'headers' ? 'active' : ''}`}
          onClick={() => setActiveTab('headers')}
        >
          Headers
        </button>
        {activeTab === 'body' && (
          <div className="view-toggle">
            <button
              className={`view-button ${bodyView === 'pretty' ? 'active' : ''}`}
              onClick={() => setBodyView('pretty')}
            >
              Pretty
            </button>
            <button
              className={`view-button ${bodyView === 'raw' ? 'active' : ''}`}
              onClick={() => setBodyView('raw')}
            >
              Raw
            </button>
          </div>
        )}
      </div>

      <div className="response-content">
        {activeTab === 'body' && (
          <pre className={`response-body ${bodyView}`}>
            {formatBody()}
          </pre>
        )}

        {activeTab === 'headers' && (
          <div className="headers-list">
            {Object.entries(response.headers).map(([key, value]) => (
              <div key={key} className="header-item">
                <span className="header-key">{key}:</span>
                <span className="header-value">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

