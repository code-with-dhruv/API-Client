import { useState } from 'react'
import { Send, Plus, X } from 'lucide-react'
import { Request, Header, QueryParam, HttpMethod } from '../types'
import './RequestBuilder.css'

interface RequestBuilderProps {
  request: Request
  onChange: (request: Request) => void
  onSend: (request: Request) => void
}

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

export default function RequestBuilder({ request, onChange, onSend }: RequestBuilderProps) {
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('params')

  const updateRequest = (updates: Partial<Request>) => {
    onChange({ ...request, ...updates })
  }

  const addHeader = () => {
    const newHeader: Header = {
      id: Date.now().toString(),
      key: '',
      value: '',
      enabled: true,
    }
    updateRequest({
      headers: [...request.headers, newHeader],
    })
  }

  const updateHeader = (id: string, updates: Partial<Header>) => {
    updateRequest({
      headers: request.headers.map(h => h.id === id ? { ...h, ...updates } : h),
    })
  }

  const removeHeader = (id: string) => {
    updateRequest({
      headers: request.headers.filter(h => h.id !== id),
    })
  }

  const addQueryParam = () => {
    const newParam: QueryParam = {
      id: Date.now().toString(),
      key: '',
      value: '',
      enabled: true,
    }
    updateRequest({
      queryParams: [...request.queryParams, newParam],
    })
  }

  const updateQueryParam = (id: string, updates: Partial<QueryParam>) => {
    updateRequest({
      queryParams: request.queryParams.map(p => p.id === id ? { ...p, ...updates } : p),
    })
  }

  const removeQueryParam = (id: string) => {
    updateRequest({
      queryParams: request.queryParams.filter(p => p.id !== id),
    })
  }

  return (
    <div className="request-builder">
      <div className="request-name-section">
        <input
          type="text"
          className="request-name-input"
          placeholder="Request name (e.g., Get User Profile)"
          value={request.name}
          onChange={(e) => updateRequest({ name: e.target.value })}
        />
      </div>
      <div className="request-header">
        <div className="method-selector">
          <select
            value={request.method}
            onChange={(e) => updateRequest({ method: e.target.value as HttpMethod })}
            className="method-select"
          >
            {HTTP_METHODS.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>
        <input
          type="text"
          className="url-input"
          placeholder="Enter URL (e.g., https://api.example.com/users)"
          value={request.url}
          onChange={(e) => updateRequest({ url: e.target.value })}
        />
        <button className="send-button" onClick={() => onSend(request)}>
          <Send size={16} />
          Send
        </button>
      </div>

      <div className="request-tabs">
        <button
          className={`tab ${activeTab === 'params' ? 'active' : ''}`}
          onClick={() => setActiveTab('params')}
        >
          Query Params
        </button>
        <button
          className={`tab ${activeTab === 'headers' ? 'active' : ''}`}
          onClick={() => setActiveTab('headers')}
        >
          Headers
        </button>
        {['POST', 'PUT', 'PATCH'].includes(request.method) && (
          <button
            className={`tab ${activeTab === 'body' ? 'active' : ''}`}
            onClick={() => setActiveTab('body')}
          >
            Body
          </button>
        )}
      </div>

      <div className="request-content">
        {activeTab === 'params' && (
          <div className="params-section">
            <div className="section-header">
              <span>Query Parameters</span>
              <button className="add-button" onClick={addQueryParam}>
                <Plus size={14} />
                Add
              </button>
            </div>
            <div className="params-list">
              {request.queryParams.length === 0 ? (
                <div className="empty-message">No query parameters</div>
              ) : (
                request.queryParams.map((param) => (
                  <div key={param.id} className="param-row">
                    <input
                      type="checkbox"
                      checked={param.enabled}
                      onChange={(e) => updateQueryParam(param.id, { enabled: e.target.checked })}
                      className="param-checkbox"
                    />
                    <input
                      type="text"
                      placeholder="Key"
                      value={param.key}
                      onChange={(e) => updateQueryParam(param.id, { key: e.target.value })}
                      className="param-key"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={param.value}
                      onChange={(e) => updateQueryParam(param.id, { value: e.target.value })}
                      className="param-value"
                    />
                    <button
                      className="remove-button"
                      onClick={() => removeQueryParam(param.id)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="headers-section">
            <div className="section-header">
              <span>Headers</span>
              <button className="add-button" onClick={addHeader}>
                <Plus size={14} />
                Add
              </button>
            </div>
            <div className="headers-list">
              {request.headers.length === 0 ? (
                <div className="empty-message">No headers</div>
              ) : (
                request.headers.map((header) => (
                  <div key={header.id} className="header-row">
                    <input
                      type="checkbox"
                      checked={header.enabled}
                      onChange={(e) => updateHeader(header.id, { enabled: e.target.checked })}
                      className="header-checkbox"
                    />
                    <input
                      type="text"
                      placeholder="Key"
                      value={header.key}
                      onChange={(e) => updateHeader(header.id, { key: e.target.value })}
                      className="header-key"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={header.value}
                      onChange={(e) => updateHeader(header.id, { value: e.target.value })}
                      className="header-value"
                    />
                    <button
                      className="remove-button"
                      onClick={() => removeHeader(header.id)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'body' && ['POST', 'PUT', 'PATCH'].includes(request.method) && (
          <div className="body-section">
            <div className="body-type-selector">
              <button
                className={`body-type-button ${request.bodyType === 'json' ? 'active' : ''}`}
                onClick={() => updateRequest({ bodyType: 'json' })}
              >
                JSON
              </button>
              <button
                className={`body-type-button ${request.bodyType === 'text' ? 'active' : ''}`}
                onClick={() => updateRequest({ bodyType: 'text' })}
              >
                Text
              </button>
              <button
                className={`body-type-button ${request.bodyType === 'form-data' ? 'active' : ''}`}
                onClick={() => updateRequest({ bodyType: 'form-data' })}
              >
                Form Data
              </button>
              <button
                className={`body-type-button ${request.bodyType === 'x-www-form-urlencoded' ? 'active' : ''}`}
                onClick={() => updateRequest({ bodyType: 'x-www-form-urlencoded' })}
              >
                x-www-form-urlencoded
              </button>
            </div>
            <textarea
              className="body-textarea"
              placeholder={request.bodyType === 'json' ? '{\n  "key": "value"\n}' : 'Enter body content...'}
              value={request.body}
              onChange={(e) => updateRequest({ body: e.target.value })}
            />
          </div>
        )}
      </div>
    </div>
  )
}

