import { useState } from 'react'
import { Globe, Settings, Plus, X, Trash2 } from 'lucide-react'
import { Environment } from '../types'
import { generateId } from '../lib/requestUtils'
import './EnvironmentBar.css'

interface EnvironmentBarProps {
  environments: Environment[]
  activeEnvironmentId: string | null
  onChangeActive: (id: string | null) => void
  onSaveEnvironments: (environments: Environment[]) => void
}

export default function EnvironmentBar({
  environments,
  activeEnvironmentId,
  onChangeActive,
  onSaveEnvironments,
}: EnvironmentBarProps) {
  const [isManaging, setIsManaging] = useState(false)
  const [draft, setDraft] = useState<Environment[]>(environments)

  const openManager = () => {
    setDraft(environments.map(e => ({ ...e, variables: e.variables.map(v => ({ ...v })) })))
    setIsManaging(true)
  }

  const closeManager = () => setIsManaging(false)

  const saveAndClose = () => {
    onSaveEnvironments(draft)
    setIsManaging(false)
  }

  const addEnvironment = () => {
    const newEnv: Environment = { id: generateId(), name: 'New Environment', variables: [] }
    setDraft(prev => [...prev, newEnv])
  }

  const removeEnvironment = (id: string) => {
    setDraft(prev => prev.filter(e => e.id !== id))
  }

  const renameEnvironment = (id: string, name: string) => {
    setDraft(prev => prev.map(e => (e.id === id ? { ...e, name } : e)))
  }

  const addVariable = (envId: string) => {
    setDraft(prev =>
      prev.map(e =>
        e.id === envId
          ? { ...e, variables: [...e.variables, { id: generateId(), key: '', value: '', enabled: true }] }
          : e
      )
    )
  }

  const updateVariable = (envId: string, varId: string, updates: Partial<Environment['variables'][0]>) => {
    setDraft(prev =>
      prev.map(e =>
        e.id === envId
          ? { ...e, variables: e.variables.map(v => (v.id === varId ? { ...v, ...updates } : v)) }
          : e
      )
    )
  }

  const removeVariable = (envId: string, varId: string) => {
    setDraft(prev =>
      prev.map(e => (e.id === envId ? { ...e, variables: e.variables.filter(v => v.id !== varId) } : e))
    )
  }

  const activeEnvironment = environments.find(e => e.id === activeEnvironmentId) || null

  return (
    <div className="environment-bar">
      <Globe size={14} className="environment-bar-icon" />
      <select
        className="environment-select"
        value={activeEnvironmentId || ''}
        onChange={(e) => onChangeActive(e.target.value || null)}
      >
        <option value="">No environment</option>
        {environments.map(env => (
          <option key={env.id} value={env.id}>{env.name}</option>
        ))}
      </select>
      <button className="environment-manage-button" onClick={openManager} title="Manage environments">
        <Settings size={14} />
      </button>
      {activeEnvironment && activeEnvironment.variables.length === 0 && (
        <span className="environment-hint">This environment has no variables yet</span>
      )}

      {isManaging && (
        <div className="environment-modal-overlay" onClick={closeManager}>
          <div className="environment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="environment-modal-header">
              <h3>Environments</h3>
              <button className="environment-modal-close" onClick={closeManager}>
                <X size={18} />
              </button>
            </div>

            <div className="environment-modal-body">
              {draft.length === 0 && (
                <div className="environment-empty">
                  No environments yet. Create one to reuse values like a base URL or API key
                  across requests with <code>{'{{variableName}}'}</code>.
                </div>
              )}
              {draft.map(env => (
                <div key={env.id} className="environment-editor">
                  <div className="environment-editor-header">
                    <input
                      type="text"
                      className="environment-name-input"
                      value={env.name}
                      onChange={(e) => renameEnvironment(env.id, e.target.value)}
                    />
                    <button
                      className="remove-button"
                      onClick={() => removeEnvironment(env.id)}
                      title="Delete environment"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="environment-variables">
                    {env.variables.map(v => (
                      <div key={v.id} className="param-row">
                        <input
                          type="checkbox"
                          checked={v.enabled}
                          onChange={(e) => updateVariable(env.id, v.id, { enabled: e.target.checked })}
                          className="param-checkbox"
                        />
                        <input
                          type="text"
                          placeholder="Variable name (e.g. baseUrl)"
                          value={v.key}
                          onChange={(e) => updateVariable(env.id, v.id, { key: e.target.value })}
                          className="param-key"
                        />
                        <input
                          type="text"
                          placeholder="Value"
                          value={v.value}
                          onChange={(e) => updateVariable(env.id, v.id, { value: e.target.value })}
                          className="param-value"
                        />
                        <button className="remove-button" onClick={() => removeVariable(env.id, v.id)}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <button className="add-button" onClick={() => addVariable(env.id)}>
                      <Plus size={14} />
                      Add variable
                    </button>
                  </div>
                </div>
              ))}
              <button className="new-collection-button" onClick={addEnvironment}>
                <Plus size={16} />
                New Environment
              </button>
            </div>

            <div className="environment-modal-footer">
              <button className="auth-switch-button" onClick={closeManager}>Cancel</button>
              <button className="auth-submit-button environment-save-button" onClick={saveAndClose}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
