import { useState, useMemo } from 'react'
import { CheckCircle, XCircle, Clock, FileText, Copy, Check, Download } from 'lucide-react'
import { Response } from '../types'
import './ResponseViewer.css'
import './ResponseViewer.extra.css'

interface ResponseViewerProps {
  response: Response | null
}

type BodyView = 'pretty' | 'raw' | 'preview'

function getContentType(headers: Record<string, string>): string {
  const key = Object.keys(headers).find(k => k.toLowerCase() === 'content-type')
  return key ? headers[key].toLowerCase() : ''
}

/** Best-effort check for whether `data` already looks like base64 (vs. plain decoded text/JSON). */
function looksLikeBase64(data: unknown): data is string {
  return typeof data === 'string' && data.length > 0 && /^[A-Za-z0-9+/=\s]+$/.test(data) && data.length % 4 === 0
}

export default function ResponseViewer({ response }: ResponseViewerProps) {
  const [activeTab, setActiveTab] = useState<'body' | 'headers'>('body')
  const [bodyView, setBodyView] = useState<BodyView>('pretty')
  const [copied, setCopied] = useState(false)

  const contentType = response ? getContentType(response.headers) : ''
  const isHtml = contentType.includes('text/html')
  const isImage = contentType.includes('image/')
  const isPdf = contentType.includes('application/pdf')
  const canPreview = isHtml || isImage || isPdf

  // Reset to Pretty whenever a response without a preview-able type comes in,
  // so the tab doesn't get stuck showing a stale preview.
  useMemo(() => {
    if (!canPreview && bodyView === 'preview') {
      setBodyView('pretty')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response])

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

  const copyBody = async () => {
    try {
      await navigator.clipboard.writeText(formatBody())
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      console.error('Failed to copy response body:', error)
    }
  }

  const downloadBody = () => {
    try {
      const isJson = !isHtml && !isImage && (contentType.includes('json') || typeof response.data !== 'string')
      const blob = new Blob([formatBody()], { type: contentType || (isJson ? 'application/json' : 'text/plain') })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const ext = isHtml ? 'html' : isJson ? 'json' : 'txt'
      a.download = `response.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download response body:', error)
    }
  }

  const renderPreview = () => {
    if (isHtml) {
      return (
        <iframe
          className="response-preview-frame"
          title="Response preview"
          sandbox="allow-same-origin"
          srcDoc={formatBody()}
        />
      )
    }
    if (isImage) {
      const src = looksLikeBase64(response.data)
        ? `data:${contentType};base64,${response.data}`
        : typeof response.data === 'string'
          ? response.data
          : ''
      if (!src) {
        return (
          <div className="preview-unavailable">
            Image preview isn't available — the response body wasn't returned as base64 or a URL.
          </div>
        )
      }
      return <img className="response-preview-image" src={src} alt="Response preview" />
    }
    if (isPdf && looksLikeBase64(response.data)) {
      return (
        <iframe
          className="response-preview-frame"
          title="Response preview"
          src={`data:application/pdf;base64,${response.data}`}
        />
      )
    }
    return <div className="preview-unavailable">No preview available for this content type.</div>
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
            {canPreview && (
              <button
                className={`view-button ${bodyView === 'preview' ? 'active' : ''}`}
                onClick={() => setBodyView('preview')}
              >
                Preview
              </button>
            )}
          </div>
        )}
        {activeTab === 'body' && (
          <div className="response-actions">
            <button className="response-action-button" onClick={copyBody} title="Copy body">
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
            <button className="response-action-button" onClick={downloadBody} title="Download body">
              <Download size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="response-content">
        {activeTab === 'body' && bodyView === 'preview' && renderPreview()}
        {activeTab === 'body' && bodyView !== 'preview' && (
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