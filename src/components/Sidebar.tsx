import { useState, useMemo } from 'react'
import { History, Folder, Plus, Clock, ChevronDown, ChevronRight, X, Trash2, Pencil, Search, Check } from 'lucide-react'
import { Request, HistoryItem, Collection } from '../types'
import './Sidebar.css'
import './Sidebar.extra.css'

interface SidebarProps {
  history: HistoryItem[]
  collections: Collection[]
  onSelectRequest: (request: Request) => void
  onCreateCollection: (name: string) => Promise<void>
  onAddRequestToCollection: (collectionId: string, request: Request) => Promise<void>
  currentRequest: Request | null
  onDeleteHistoryItem?: (historyItemId: string) => void
  onClearHistory?: () => void
  onDeleteCollection?: (collectionId: string) => void
  onDeleteRequestFromCollection?: (requestId: string) => void
  onRenameCollection?: (collectionId: string, name: string) => void
}

export default function Sidebar({
  history,
  collections,
  onSelectRequest,
  onCreateCollection,
  onAddRequestToCollection,
  currentRequest,
  onDeleteHistoryItem,
  onClearHistory,
  onDeleteCollection,
  onDeleteRequestFromCollection,
  onRenameCollection,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'collections'>('history')
  const [showNewCollectionInput, setShowNewCollectionInput] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set())
  const [showAddToCollectionMenu, setShowAddToCollectionMenu] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [renamingCollectionId, setRenamingCollectionId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

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

  const startRename = (collection: Collection, e: React.MouseEvent) => {
    e.stopPropagation()
    setRenamingCollectionId(collection.id)
    setRenameValue(collection.name)
  }

  const commitRename = (collectionId: string) => {
    if (renameValue.trim() && onRenameCollection) {
      onRenameCollection(collectionId, renameValue.trim())
    }
    setRenamingCollectionId(null)
  }

  const handleDeleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    onDeleteHistoryItem?.(id)
  }

  const handleClearHistory = () => {
    if (window.confirm('Clear all request history? This cannot be undone.')) {
      onClearHistory?.()
    }
  }

  const handleDeleteCollection = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation()
    if (window.confirm(`Delete collection "${name}"? This also removes its saved requests.`)) {
      onDeleteCollection?.(id)
    }
  }

  const handleDeleteRequestFromCollection = (e: React.MouseEvent, requestId: string) => {
    e.stopPropagation()
    onDeleteRequestFromCollection?.(requestId)
  }

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history
    const q = searchQuery.toLowerCase()
    return history.filter(item =>
      item.request.url.toLowerCase().includes(q) ||
      item.request.name?.toLowerCase().includes(q) ||
      item.request.method.toLowerCase().includes(q)
    )
  }, [history, searchQuery])

  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) return collections
    const q = searchQuery.toLowerCase()
    return collections
      .map(collection => ({
        ...collection,
        requests: collection.requests.filter(
          req => req.url.toLowerCase().includes(q) || req.name?.toLowerCase().includes(q)
        ),
      }))
      .filter(collection => collection.name.toLowerCase().includes(q) || collection.requests.length > 0)
  }, [collections, searchQuery])

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

      <div className="sidebar-search">
        <Search size={14} className="sidebar-search-icon" />
        <input
          type="text"
          placeholder={activeTab === 'history' ? 'Search history...' : 'Search collections...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sidebar-search-input"
        />
        {searchQuery && (
          <button className="sidebar-search-clear" onClick={() => setSearchQuery('')}>
            <X size={12} />
          </button>
        )}
      </div>

      <div className="sidebar-content">
        {activeTab === 'history' ? (
          <div className="history-list">
            {history.length > 0 && (
              <button className="clear-history-button" onClick={handleClearHistory}>
                <Trash2 size={12} />
                Clear all history
              </button>
            )}
            {filteredHistory.length === 0 ? (
              <div className="empty-state">
                <History size={48} />
                <p>{searchQuery ? 'No matching history' : 'No request history'}</p>
              </div>
            ) : (
              filteredHistory.map((item) => (
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
                  <button
                    className="item-delete-button"
                    onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                    title="Delete from history"
                  >
                    <Trash2 size={13} />
                  </button>
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
            {filteredCollections.length === 0 ? (
              <div className="empty-state">
                <Folder size={48} />
                <p>{searchQuery ? 'No matching collections' : 'No collections'}</p>
              </div>
            ) : (
              filteredCollections.map((collection) => {
                const isExpanded = expandedCollections.has(collection.id) || !!searchQuery
                const isRenaming = renamingCollectionId === collection.id
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
                      {isRenaming ? (
                        <input
                          type="text"
                          className="collection-rename-input"
                          value={renameValue}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename(collection.id)
                            if (e.key === 'Escape') setRenamingCollectionId(null)
                          }}
                          onBlur={() => commitRename(collection.id)}
                        />
                      ) : (
                        <span className="collection-name">{collection.name}</span>
                      )}
                      <span className="collection-count">({collection.requests.length})</span>
                      {isRenaming ? (
                        <button
                          className="add-to-collection-button"
                          onClick={(e) => { e.stopPropagation(); commitRename(collection.id) }}
                          title="Save name"
                        >
                          <Check size={12} />
                        </button>
                      ) : (
                        <button
                          className="add-to-collection-button"
                          onClick={(e) => startRename(collection, e)}
                          title="Rename collection"
                        >
                          <Pencil size={12} />
                        </button>
                      )}
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
                      <button
                        className="add-to-collection-button collection-delete-button"
                        onClick={(e) => handleDeleteCollection(e, collection.id, collection.name)}
                        title="Delete collection"
                      >
                        <Trash2 size={12} />
                      </button>
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
                              <button
                                className="item-delete-button"
                                onClick={(e) => handleDeleteRequestFromCollection(e, request.id)}
                                title="Remove from collection"
                              >
                                <Trash2 size={13} />
                              </button>
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
