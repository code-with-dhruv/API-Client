import { useState } from 'react'
import { History, Folder, Plus, Clock, ChevronDown, ChevronRight, X } from 'lucide-react'
import { Request, HistoryItem, Collection } from '../types'
import './Sidebar.css'

interface SidebarProps {
  history: HistoryItem[]
  collections: Collection[]
  onSelectRequest: (request: Request) => void
  onCreateCollection: (name: string) => Promise<void>
  onAddRequestToCollection: (collectionId: string, request: Request) => Promise<void>
  currentRequest: Request | null
}

export default function Sidebar({ 
  history, 
  collections, 
  onSelectRequest,
  onCreateCollection,
  onAddRequestToCollection,
  currentRequest
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'collections'>('history')
  const [showNewCollectionInput, setShowNewCollectionInput] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set())
  const [showAddToCollectionMenu, setShowAddToCollectionMenu] = useState<string | null>(null)

  const handleCreateCollection = async () => {
    if (newCollectionName.trim()) {
      await onCreateCollection(newCollectionName.trim())
      setNewCollectionName('')
      setShowNewCollectionInput(false)
    }
  }

  const toggleCollection = (collectionId: string) => {
    setExpandedCollections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId)
      } else {
        newSet.add(collectionId)
      }
      return newSet
    })
  }

  const handleAddRequestToCollection = async (collectionId: string) => {
    if (currentRequest) {
      await onAddRequestToCollection(collectionId, currentRequest)
      setShowAddToCollectionMenu(null)
    }
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <button
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Clock size={16} />
          History
        </button>
        <button
          className={`tab-button ${activeTab === 'collections' ? 'active' : ''}`}
          onClick={() => setActiveTab('collections')}
        >
          <Folder size={16} />
          Collections
        </button>
      </div>

      <div className="sidebar-content">
        {activeTab === 'history' ? (
          <div className="history-list">
            {history.length === 0 ? (
              <div className="empty-state">
                <History size={48} />
                <p>No request history</p>
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="history-item"
                  onClick={() => onSelectRequest(item.request)}
                >
                  <div className="method-badge" data-method={item.request.method}>
                    {item.request.method}
                  </div>
                  <div className="history-item-content">
                    <div className="history-item-url">{item.request.url || 'Untitled'}</div>
                    <div className="history-item-meta">
                      {item.response.status} • {item.response.time}ms
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="collections-list">
            {showNewCollectionInput ? (
              <div className="new-collection-input">
                <input
                  type="text"
                  placeholder="Collection name"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateCollection()
                    } else if (e.key === 'Escape') {
                      setShowNewCollectionInput(false)
                      setNewCollectionName('')
                    }
                  }}
                  autoFocus
                  className="collection-name-input"
                />
                <div className="collection-input-actions">
                  <button
                    className="collection-input-button"
                    onClick={handleCreateCollection}
                  >
                    Create
                  </button>
                  <button
                    className="collection-input-button"
                    onClick={() => {
                      setShowNewCollectionInput(false)
                      setNewCollectionName('')
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="new-collection-button"
                onClick={() => setShowNewCollectionInput(true)}
              >
                <Plus size={16} />
                New Collection
              </button>
            )}
            {collections.length === 0 ? (
              <div className="empty-state">
                <Folder size={48} />
                <p>No collections</p>
              </div>
            ) : (
              collections.map((collection) => {
                const isExpanded = expandedCollections.has(collection.id)
                return (
                  <div key={collection.id} className="collection-wrapper">
                    <div
                      className="collection-item"
                      onClick={() => toggleCollection(collection.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown size={14} className="collection-chevron" />
                      ) : (
                        <ChevronRight size={14} className="collection-chevron" />
                      )}
                      <span className="collection-name">{collection.name}</span>
                      <span className="collection-count">({collection.requests.length})</span>
                      {currentRequest && (
                        <button
                          className="add-to-collection-button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowAddToCollectionMenu(
                              showAddToCollectionMenu === collection.id ? null : collection.id
                            )
                          }}
                          title="Add current request to collection"
                        >
                          <Plus size={12} />
                        </button>
                      )}
                    </div>
                    {isExpanded && (
                      <div className="collection-requests">
                        {collection.requests.length === 0 ? (
                          <div className="empty-collection-message">
                            No requests in this collection
                          </div>
                        ) : (
                          collection.requests.map((request) => (
                            <div
                              key={request.id}
                              className="collection-request-item"
                              onClick={() => onSelectRequest(request)}
                            >
                              <div className="method-badge" data-method={request.method}>
                                {request.method}
                              </div>
                              <div className="collection-request-content">
                                <div className="collection-request-url">
                                  {request.name || request.url || 'Untitled'}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                    {showAddToCollectionMenu === collection.id && currentRequest && (
                      <div className="add-to-collection-menu">
                        <div className="add-to-collection-menu-item">
                          Add "{currentRequest.name || currentRequest.url || 'Current Request'}" to this collection?
                        </div>
                        <div className="add-to-collection-menu-actions">
                          <button
                            className="add-to-collection-confirm"
                            onClick={() => handleAddRequestToCollection(collection.id)}
                          >
                            Add
                          </button>
                          <button
                            className="add-to-collection-cancel"
                            onClick={() => setShowAddToCollectionMenu(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}

