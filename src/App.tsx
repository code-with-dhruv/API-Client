import { useState, useEffect, useCallback, useRef } from 'react'
import Sidebar from './components/Sidebar'
import RequestBuilder from './components/RequestBuilder'
import ResponseViewer from './components/ResponseViewer'
import Header from './components/Header'
import TabBar, { Tab } from './components/TabBar'
import EnvironmentBar from './components/EnvironmentBar'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Request, Response, HistoryItem, Collection, Environment } from './types'
import './theme-dark.css'
import { saveHistoryItem, loadUserHistory, deleteHistoryItem, clearUserHistory } from './lib/historyService'
import {
  saveLocalHistoryItem,
  loadLocalHistory,
  deleteLocalHistoryItem,
  clearLocalHistory,
} from './lib/localStorageService'
import {
  createCollection,
  loadUserCollections,
  addRequestToCollection,
  updateRequestInCollection,
  deleteCollection,
  deleteRequestFromCollection,
  updateCollection,
} from './lib/collectionService'
import {
  loadEnvironments,
  saveEnvironments,
  getActiveEnvironmentId,
  setActiveEnvironmentId,
  resolveVariables,
} from './lib/environmentService'
import { withRequestDefaults, interpolateVariables, validateRequest, generateId } from './lib/requestUtils'
import './App.css'

const REQUEST_TIMEOUT_MS = 30000

interface TabData {
  id: string
  request: Request
  response: Response | null
}

function blankRequest(id: string): Request {
  return {
    id,
    name: 'New Request',
    method: 'GET',
    url: '',
    headers: [],
    queryParams: [],
    body: '',
    bodyType: 'json',
    formData: [],
    auth: { type: 'none' },
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Request timed out after ${ms / 1000}s`))
    }, ms)
    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

function AppContent() {
  const { user } = useAuth()
  const [tabs, setTabs] = useState<TabData[]>([
    { id: '1', request: blankRequest('1'), response: null },
  ])
  const [activeTabId, setActiveTabId] = useState<string>('1')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [collectionsLoading, setCollectionsLoading] = useState(false)
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [activeEnvironmentId, setActiveEnvId] = useState<string | null>(null)
  const [sendingTabId, setSendingTabId] = useState<string | null>(null)
  const previousUserId = useRef<string | null>(null)
  const hasMigratedForUser = useRef<Set<string>>(new Set())

  useEffect(() => {
    setEnvironments(loadEnvironments())
    setActiveEnvId(getActiveEnvironmentId())
  }, [])

  const handleSaveEnvironments = (updated: Environment[]) => {
    setEnvironments(updated)
    saveEnvironments(updated)
    // If the active environment was deleted, fall back to none.
    if (activeEnvironmentId && !updated.some(e => e.id === activeEnvironmentId)) {
      setActiveEnvId(null)
      setActiveEnvironmentId(null)
    }
  }

  const handleChangeActiveEnvironment = (id: string | null) => {
    setActiveEnvId(id)
    setActiveEnvironmentId(id)
  }

  useEffect(() => {
    const loadHistory = async () => {
      if (user) {
        setHistoryLoading(true)
        try {
          const { data, error } = await loadUserHistory(user.id, 50)
          if (error) {
            console.error('Failed to load history:', error)
            setHistory([])
          } else {
            setHistory(data || [])
          }
        } catch (error) {
          console.error('Error loading history:', error)
          setHistory([])
        } finally {
          setHistoryLoading(false)
        }
      } else {
        setHistoryLoading(true)
        try {
          const localHistory = loadLocalHistory()
          setHistory(localHistory)
        } catch (error) {
          console.error('Error loading local history:', error)
          setHistory([])
        } finally {
          setHistoryLoading(false)
        }
      }
    }

    loadHistory()
  }, [user])

  useEffect(() => {
    const loadCollections = async () => {
      if (user) {
        setCollectionsLoading(true)
        try {
          const { data, error } = await loadUserCollections(user.id)
          if (error) {
            console.error('Failed to load collections:', error)
            setCollections([])
          } else {
            setCollections(data || [])
          }
        } catch (error) {
          console.error('Error loading collections:', error)
          setCollections([])
        } finally {
          setCollectionsLoading(false)
        }
      } else {
        setCollections([])
      }
    }

    loadCollections()
  }, [user])

  // Local (signed-out) history is device-only. When someone signs in, carry
  // it over to their account once so it isn't silently lost, then clear the
  // local copy so it isn't duplicated on future sign-ins.
  useEffect(() => {
    const migrate = async () => {
      const wasSignedOut = previousUserId.current === null
      previousUserId.current = user?.id ?? null

      if (!user || !wasSignedOut) return
      if (hasMigratedForUser.current.has(user.id)) return

      const localItems = loadLocalHistory()
      if (localItems.length === 0) return

      hasMigratedForUser.current.add(user.id)
      try {
        await Promise.all(localItems.map(item => saveHistoryItem(user.id, item)))
        clearLocalHistory()
        const { data } = await loadUserHistory(user.id, 50)
        if (data) setHistory(data)
      } catch (error) {
        console.error('Error migrating local history to account:', error)
      }
    }

    migrate()
  }, [user])

  const handleCreateCollection = async (name: string) => {
    if (!user) {
      console.error('User must be logged in to create collections')
      return
    }

    try {
      const { data, error } = await createCollection(user.id, name)
      if (error) {
        console.error('Failed to create collection:', error)
        alert('Failed to create collection: ' + error.message)
      } else if (data) {
        const { data: updatedCollections, error: loadError } = await loadUserCollections(user.id)
        if (!loadError && updatedCollections) {
          setCollections(updatedCollections)
        }
      }
    } catch (error) {
      console.error('Error creating collection:', error)
      alert('Failed to create collection')
    }
  }

  const handleRenameCollection = async (collectionId: string, name: string) => {
    if (!user) return
    try {
      const { error } = await updateCollection(user.id, collectionId, name)
      if (error) {
        console.error('Failed to rename collection:', error)
        alert('Failed to rename collection: ' + error.message)
        return
      }
      setCollections(prev => prev.map(c => (c.id === collectionId ? { ...c, name } : c)))
    } catch (error) {
      console.error('Error renaming collection:', error)
    }
  }

  const handleDeleteCollection = async (collectionId: string) => {
    if (!user) return
    const previous = collections
    setCollections(prev => prev.filter(c => c.id !== collectionId))
    try {
      const { error } = await deleteCollection(user.id, collectionId)
      if (error) {
        console.error('Failed to delete collection:', error)
        alert('Failed to delete collection: ' + error.message)
        setCollections(previous)
      }
    } catch (error) {
      console.error('Error deleting collection:', error)
      setCollections(previous)
    }
  }

  const handleDeleteRequestFromCollection = async (requestId: string) => {
    if (!user) return
    const previous = collections
    setCollections(prev =>
      prev.map(c => ({ ...c, requests: c.requests.filter(r => r.id !== requestId) }))
    )
    try {
      const { error } = await deleteRequestFromCollection(user.id, requestId)
      if (error) {
        console.error('Failed to remove request from collection:', error)
        alert('Failed to remove request: ' + error.message)
        setCollections(previous)
      }
    } catch (error) {
      console.error('Error removing request from collection:', error)
      setCollections(previous)
    }
  }

  const handleDeleteHistoryItem = async (historyItemId: string) => {
    const previous = history
    setHistory(prev => prev.filter(h => h.id !== historyItemId))
    if (user) {
      const { error } = await deleteHistoryItem(user.id, historyItemId)
      if (error) {
        console.error('Failed to delete history item:', error)
        setHistory(previous)
      }
    } else {
      deleteLocalHistoryItem(historyItemId)
    }
  }

  const handleClearHistory = async () => {
    const previous = history
    setHistory([])
    if (user) {
      const { error } = await clearUserHistory(user.id)
      if (error) {
        console.error('Failed to clear history:', error)
        setHistory(previous)
      }
    } else {
      clearLocalHistory()
    }
  }

  const handleAddRequestToCollection = async (collectionId: string, request: Request) => {
    if (!user) {
      console.error('User must be logged in to add requests to collections')
      return
    }

    try {
      const { error } = await addRequestToCollection(user.id, collectionId, request)
      if (error) {
        console.error('Failed to add request to collection:', error)
        alert('Failed to add request to collection: ' + error.message)
      } else {
        const { data: updatedCollections, error: loadError } = await loadUserCollections(user.id)
        if (!loadError && updatedCollections) {
          setCollections(updatedCollections)
        }
      }
    } catch (error) {
      console.error('Error adding request to collection:', error)
      alert('Failed to add request to collection')
    }
  }

  const getActiveTab = useCallback(() => {
    return tabs.find(tab => tab.id === activeTabId)
  }, [tabs, activeTabId])

  const createNewTab = useCallback((request?: Request) => {
    const newTabId = Date.now().toString()
    const newTab: TabData = {
      id: newTabId,
      request: request ? withRequestDefaults(request) : blankRequest(newTabId),
      response: null,
    }
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newTabId)
    return newTabId
  }, [])

  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== tabId)
      if (tabId === activeTabId && newTabs.length > 0) {
        const closedIndex = prev.findIndex(tab => tab.id === tabId)
        const newActiveIndex = closedIndex > 0 ? closedIndex - 1 : 0
        setActiveTabId(newTabs[newActiveIndex].id)
      }
      if (newTabs.length === 0) {
        const newTabId = Date.now().toString()
        const newTab: TabData = { id: newTabId, request: blankRequest(newTabId), response: null }
        setActiveTabId(newTabId)
        return [newTab]
      }
      return newTabs
    })
  }, [activeTabId])

  const switchTab = useCallback((tabId: string) => {
    setActiveTabId(tabId)
  }, [])

  const handleRequestChange = async (updatedRequest: Request) => {
    setTabs(prev => prev.map(tab =>
      tab.id === activeTabId
        ? { ...tab, request: updatedRequest }
        : tab
    ))

    if (user) {
      const requestInCollection = collections.find(collection =>
        collection.requests.some(req => req.id === updatedRequest.id)
      )

      if (requestInCollection) {
        try {
          const { error } = await updateRequestInCollection(
            user.id,
            updatedRequest.id,
            updatedRequest
          )
          if (error) {
            console.error('Failed to update request in collection:', error)
          } else {
            const { data: updatedCollections, error: loadError } = await loadUserCollections(user.id)
            if (!loadError && updatedCollections) {
              setCollections(updatedCollections)
            }
          }
        } catch (error) {
          console.error('Error updating request in collection:', error)
        }
      }
    }
  }

  const handleSendRequest = async (rawRequest: Request) => {
    const startTime = Date.now()
    const targetTabId = activeTabId

    const validationError = validateRequest(rawRequest)
    if (validationError) {
      const errorResponse: Response = {
        status: 0,
        statusText: 'Invalid Request',
        headers: {},
        data: { error: validationError },
        time: 0,
        size: 0,
      }
      setTabs(prev => prev.map(tab => tab.id === targetTabId ? { ...tab, response: errorResponse } : tab))
      return
    }

    const request = rawRequest
    const activeEnvironment = environments.find(e => e.id === activeEnvironmentId) || null
    const variables = resolveVariables(activeEnvironment)
    const interp = (value: string) => interpolateVariables(value, variables)

    setSendingTabId(targetTabId)

    try {
      let url = interp(request.url.trim())

      if (!url.match(/^https?:\/\//i)) {
        url = 'http://' + url
      }

      const enabledParams = request.queryParams.filter(p => p.enabled && p.key)
      const params = new URLSearchParams()
      enabledParams.forEach(p => params.append(interp(p.key), interp(p.value)))

      const headers: Record<string, string> = {}
      request.headers
        .filter(h => h.enabled && h.key)
        .forEach(h => {
          headers[interp(h.key)] = interp(h.value)
        })

      // Apply auth on top of manual headers/params.
      const auth = request.auth
      if (auth?.type === 'bearer' && auth.token) {
        headers['Authorization'] = `Bearer ${interp(auth.token)}`
      } else if (auth?.type === 'basic' && auth.username) {
        const encoded = btoa(`${interp(auth.username)}:${interp(auth.password || '')}`)
        headers['Authorization'] = `Basic ${encoded}`
      } else if (auth?.type === 'apiKey' && auth.apiKeyName) {
        if (auth.apiKeyLocation === 'query') {
          params.append(interp(auth.apiKeyName), interp(auth.apiKeyValue || ''))
        } else {
          headers[interp(auth.apiKeyName)] = interp(auth.apiKeyValue || '')
        }
      }

      const paramString = params.toString()
      if (paramString) {
        url += (url.includes('?') ? '&' : '?') + paramString
      }

      let body: string | undefined
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        if (request.bodyType === 'json') {
          body = interp(request.body)
          headers['Content-Type'] = headers['Content-Type'] || 'application/json'
        } else if (request.bodyType === 'text') {
          body = interp(request.body)
          headers['Content-Type'] = headers['Content-Type'] || 'text/plain'
        } else if (request.bodyType === 'x-www-form-urlencoded') {
          body = interp(request.body)
          headers['Content-Type'] = headers['Content-Type'] || 'application/x-www-form-urlencoded'
        } else if (request.bodyType === 'form-data') {
          const boundary = `----RequestBoundary${Math.random().toString(36).slice(2)}`
          const fields = (request.formData || []).filter(f => f.enabled && f.key)
          body = fields
            .map(f => `--${boundary}\r\nContent-Disposition: form-data; name="${interp(f.key)}"\r\n\r\n${interp(f.value)}\r\n`)
            .join('') + `--${boundary}--`
          headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`
        }
      }

      let newResponse: Response

      if (window.electron?.makeRequest) {
        try {
          newResponse = await withTimeout(
            window.electron.makeRequest({
              method: request.method,
              url,
              headers,
              body: body || undefined,
            }),
            REQUEST_TIMEOUT_MS
          )
        } catch (error: any) {
          throw new Error(error.message || 'IPC call failed')
        }
      } else {
        throw new Error(
          'This app must be run in Electron to make API requests. ' +
          'Please use the Electron app window, not a regular browser. ' +
          'Run "npm run dev" to start the Electron app.'
        )
      }

      setTabs(prev => prev.map(tab =>
        tab.id === targetTabId
          ? { ...tab, response: newResponse }
          : tab
      ))

      const historyItem: HistoryItem = {
        id: generateId(),
        request,
        response: newResponse,
        timestamp: Date.now(),
      }

      setHistory(prev => [historyItem, ...prev].slice(0, 50))

      if (user) {
        saveHistoryItem(user.id, historyItem).catch((error) => {
          console.error('Failed to save history to Supabase:', error)
        })
      } else {
        try {
          saveLocalHistoryItem(historyItem)
        } catch (error) {
          console.error('Failed to save history to local storage:', error)
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch'
      const errorResponse: Response = {
        status: 0,
        statusText: 'Error',
        headers: {},
        data: {
          error: errorMessage,
          details: error.stack || error.toString(),
          url: request.url,
        },
        time: Date.now() - startTime,
        size: 0,
      }
      setTabs(prev => prev.map(tab =>
        tab.id === targetTabId
          ? { ...tab, response: errorResponse }
          : tab
      ))
      console.error('Request failed:', error)
    } finally {
      setSendingTabId(current => (current === targetTabId ? null : current))
    }
  }

  const handleSelectRequest = (request: Request) => {
    const normalized = withRequestDefaults(request)
    const existingTab = tabs.find(tab =>
      tab.request.url === normalized.url &&
      tab.request.method === normalized.method &&
      tab.request.name === normalized.name
    )
    if (existingTab) {
      setActiveTabId(existingTab.id)
    } else {
      const newRequest: Request = {
        ...normalized,
        id: generateId(),
      }
      createNewTab(newRequest)
    }
  }

  const activeTab = getActiveTab()
  const tabBarTabs: Tab[] = tabs.map(tab => ({
    id: tab.id,
    name: tab.request.name || tab.request.url || 'New Request',
    requestId: tab.request.id,
  }))

  return (
    <div className="app">
      <Header />
      <EnvironmentBar
        environments={environments}
        activeEnvironmentId={activeEnvironmentId}
        onChangeActive={handleChangeActiveEnvironment}
        onSaveEnvironments={handleSaveEnvironments}
      />
      <div className="app-body">
        <Sidebar
          history={history}
          collections={collections}
          onSelectRequest={handleSelectRequest}
          onCreateCollection={handleCreateCollection}
          onAddRequestToCollection={handleAddRequestToCollection}
          currentRequest={activeTab?.request || null}
          onDeleteHistoryItem={handleDeleteHistoryItem}
          onClearHistory={handleClearHistory}
          onDeleteCollection={handleDeleteCollection}
          onDeleteRequestFromCollection={handleDeleteRequestFromCollection}
          onRenameCollection={handleRenameCollection}
        />
        <div className="main-content">
          <TabBar
            tabs={tabBarTabs}
            activeTabId={activeTabId}
            onTabClick={switchTab}
            onTabClose={(tabId, e) => {
              e.stopPropagation()
              closeTab(tabId)
            }}
            onNewTab={() => createNewTab()}
          />
          {activeTab && (
            <>
              <RequestBuilder
                request={activeTab.request}
                onChange={handleRequestChange}
                onSend={handleSendRequest}
                sending={sendingTabId === activeTab.id}
              />
              <ResponseViewer response={activeTab.response} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
