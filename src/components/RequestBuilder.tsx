import { useState, useEffect, useCallback } from 'react'
import { Send, Plus, X, AlertCircle, Copy, Check } from 'lucide-react'
import { Request, Header, QueryParam, FormDataField, HttpMethod, AuthType } from '../types'
import { validateRequest, requestToCurl, generateId } from '../lib/requestUtils'
import './RequestBuilder.css'
import './RequestBuilder.extra.css'

interface RequestBuilderProps {
  request: Request
  onChange: (request: Request) => void
  onSend: (request: Request) => void
  sending?: boolean
}

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

export default function RequestBuilder({ request, onChange, onSend, sending }: RequestBuilderProps) {
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth'>('params')
  const [curlCopied, setCurlCopied] = useState(false)

  const updateRequest = (updates: Partial<Request>) => {
    onChange({ ...request, ...updates })
  }

  const handleSend = useCallback(() => {
    const validationError = validateRequest(request)
    if (validationError) {
      // Surface a lightweight inline warning instead of just failing silently on send.
      window.alert(validationError)
      return
    }
    onSend(request)
  }, [request, onSend])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSend()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSend])

  const addHeader = () => {
    const newHeader: Header = { id: generateId(), key: '', value: '', enabled: true }
    updateRequest({ headers: [...request.headers, newHeader] })
  }

  const updateHeader = (id: string, updates: Partial<Header>) => {
    updateRequest({ headers: request.headers.map(h => h.id === id ? { ...h, ...updates } : h) })
  }

  const removeHeader = (id: string) => {
    updateRequest({ headers: request.headers.filter(h => h.id !== id) })
  }

  const addQueryParam = () => {
    const newParam: QueryParam = { id: generateId(), key: '', value: '', enabled: true }
    updateRequest({ queryParams: [...request.queryParams, newParam] })
  }

  const updateQueryParam = (id: string, updates: Partial<QueryParam>) => {
    updateRequest({ queryParams: request.queryParams.map(p => p.id === id ? { ...p, ...updates } : p) })
  }

  const removeQueryParam = (id: string) => {
    updateRequest({ queryParams: request.queryParams.filter(p => p.id !== id) })
  }

  const formData = request.formData || []

  const addFormDataField = () => {
    const newField: FormDataField = { id: generateId(), key: '', value: '', enabled: true }
    updateRequest({ formData: [...formData, newField] })
  }

  const updateFormDataField = (id: string, updates: Partial<FormDataField>) => {
    updateRequest({ formData: formData.map(f => f.id === id ? { ...f, ...updates } : f) })
  }

  const removeFormDataField = (id: string) => {
    updateRequest({ formData: formData.filter(f => f.id !== id) })
  }

  const auth = request.auth || { type: 'none' as AuthType }

  const copyAsCurl = async () => {
    try {
      await navigator.clipboard.writeText(requestToCurl(request))
      setCurlCopied(true)
      setTimeout(() => setCurlCopied(false), 1500)
    } catch (error) {
      console.error('Failed to copy cURL command:', error)
    }
  }

  let jsonError: string | null = null
  if (request.bodyType === 'json' && request.body?.trim()) {
    try {
      JSON.parse(request.body)
    } catch (e: any) {
      jsonError = e.message
    }
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
        <button className="curl-copy-button" onClick={copyAsCurl} title="Copy as cURL">
          {curlCopied ? <Check size={14} /> : <Copy size={14} />}
          {curlCopied ? 'Copied' : 'Copy as cURL'}
        </button>
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
          placeholder="Enter URL (e.g., https://api.example.com/users or {{baseUrl}}/users)"
          value={request.url}
          onChange={(e) => updateRequest({ url: e.target.value })}
        />
        <button className="send-button" onClick={handleSend} disabled={sending} title="Send (Ctrl/Cmd+Enter)">
          <Send size={16} />
          {sending ? 'Sending...' : 'Send'}
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
        <button
          className={`tab ${activeTab === 'auth' ? 'active' : ''}`}
          onClick={() => setActiveTab('auth')}
        >
          Auth{auth.type !== 'none' ? ' •' : ''}
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

        {activeTab === 'auth' && (
          <div className="auth-section">
            <div className="section-header">
              <span>Authorization</span>
            </div>
            <select
              className="auth-type-select"
              value={auth.type}
              onChange={(e) => updateRequest({ auth: { ...auth, type: e.target.value as AuthType } })}
            >
              <option value="none">No Auth</option>
              <option value="bearer">Bearer Token</option>
              <option value="basic">Basic Auth</option>
              <option value="apiKey">API Key</option>
            </select>

            {auth.type === 'none' && (
              <div className="empty-message">This request does not use authorization.</div>
            )}

            {auth.type === 'bearer' && (
              <div className="auth-field-group">
                <label>Token</label>
                <input
                  type="text"
                  className="auth-field-input"
                  placeholder="Bearer token or {{authToken}}"
                  value={auth.token || ''}
                  onChange={(e) => updateRequest({ auth: { ...auth, token: e.target.value } })}
                />
              </div>
            )}

            {auth.type === 'basic' && (
              <>
                <div className="auth-field-group">
                  <label>Username</label>
                  <input
                    type="text"
                    className="auth-field-input"
                    value={auth.username || ''}
                    onChange={(e) => updateRequest({ auth: { ...auth, username: e.target.value } })}
                  />
                </div>
                <div className="auth-field-group">
                  <label>Password</label>
                  <input
                    type="password"
                    className="auth-field-input"
                    value={auth.password || ''}
                    onChange={(e) => updateRequest({ auth: { ...auth, password: e.target.value } })}
                  />
                </div>
              </>
            )}

            {auth.type === 'apiKey' && (
              <>
                <div className="auth-field-group">
                  <label>Key</label>
                  <input
                    type="text"
                    className="auth-field-input"
                    placeholder="e.g. X-API-Key"
                    value={auth.apiKeyName || ''}
                    onChange={(e) => updateRequest({ auth: { ...auth, apiKeyName: e.target.value } })}
                  />
                </div>
                <div className="auth-field-group">
                  <label>Value</label>
                  <input
                    type="text"
                    className="auth-field-input"
                    value={auth.apiKeyValue || ''}
                    onChange={(e) => updateRequest({ auth: { ...auth, apiKeyValue: e.target.value } })}
                  />
                </div>
                <div className="auth-field-group">
                  <label>Add to</label>
                  <select
                    className="auth-type-select"
                    value={auth.apiKeyLocation || 'header'}
                    onChange={(e) => updateRequest({ auth: { ...auth, apiKeyLocation: e.target.value as 'header' | 'query' } })}
                  >
                    <option value="header">Header</option>
                    <option value="query">Query Params</option>
                  </select>
                </div>
              </>
            )}
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

            {request.bodyType === 'form-data' ? (
              <div className="params-list form-data-list">
                {formData.length === 0 ? (
                  <div className="empty-message">No form fields</div>
                ) : (
                  formData.map((field) => (
                    <div key={field.id} className="param-row">
                      <input
                        type="checkbox"
                        checked={field.enabled}
                        onChange={(e) => updateFormDataField(field.id, { enabled: e.target.checked })}
                        className="param-checkbox"
                      />
                      <input
                        type="text"
                        placeholder="Key"
                        value={field.key}
                        onChange={(e) => updateFormDataField(field.id, { key: e.target.value })}
                        className="param-key"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={field.value}
                        onChange={(e) => updateFormDataField(field.id, { value: e.target.value })}
                        className="param-value"
                      />
                      <button className="remove-button" onClick={() => removeFormDataField(field.id)}>
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
                <button className="add-button" onClick={addFormDataField}>
                  <Plus size={14} />
                  Add field
                </button>
              </div>
            ) : (
              <>
                <textarea
                  className="body-textarea"
                  placeholder={request.bodyType === 'json' ? '{\n  "key": "value"\n}' : 'Enter body content...'}
                  value={request.body}
                  onChange={(e) => updateRequest({ body: e.target.value })}
                />
                {jsonError && (
                  <div className="json-error">
                    <AlertCircle size={14} />
                    {jsonError}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
