import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import RequestBuilder from './components/RequestBuilder'
import ResponseViewer from './components/ResponseViewer'
import Header from './components/Header'
import TabBar, { Tab } from './components/TabBar'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Request, Response, HistoryItem, Collection } from './types'
import { saveHistoryItem, loadUserHistory } from './lib/historyService'
import { saveLocalHistoryItem, loadLocalHistory } from './lib/localStorageService'
import { 
  createCollection, 
  loadUserCollections, 
  addRequestToCollection,
  updateRequestInCollection
} from './lib/collectionService'
import './App.css'

interface TabData {
  id: string
  request: Request
  response: Response | null
}

function AppContent() {
  const { user } = useAuth()
  const [tabs, setTabs] = useState<TabData[]>([
    {
      id: '1',
      request: {
        id: '1',
        name: 'New Request',
        method: 'GET',
        url: '',
        headers: [],
        queryParams: [],
        body: '',
        bodyType: 'json',
      },
      response: null,
    },
  ])
  const [activeTabId, setActiveTabId] = useState<string>('1')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [collectionsLoading, setCollectionsLoading] = useState(false)

  useEffect(() => {
    console.log('Electron API available:', !!window.electron)
    console.log('makeRequest available:', !!window.electron?.makeRequest)
  }, [])

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
      request: request || {
        id: newTabId,
        name: 'New Request',
        method: 'GET',
        url: '',
        headers: [],
        queryParams: [],
        body: '',
        bodyType: 'json',
      },
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
        const newTab: TabData = {
          id: newTabId,
          request: {
            id: newTabId,
            name: 'New Request',
            method: 'GET',
            url: '',
            headers: [],
            queryParams: [],
            body: '',
            bodyType: 'json',
          },
          response: null,
        }
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

  const handleSendRequest = async (request: Request) => {
    const startTime = Date.now()
    
    try {
      if (!request.url || request.url.trim() === '') {
        throw new Error('URL is required')
      }

      let url = request.url.trim()
      
      if (!url.match(/^https?:\/\//i)) {
        url = 'http://' + url
      }

      const enabledParams = request.queryParams.filter(p => p.enabled && p.key)
      if (enabledParams.length > 0) {
        const params = new URLSearchParams()
        enabledParams.forEach(p => params.append(p.key, p.value))
        url += (url.includes('?') ? '&' : '?') + params.toString()
      }

      const headers: Record<string, string> = {}
      request.headers
        .filter(h => h.enabled && h.key)
        .forEach(h => {
          headers[h.key] = h.value
        })

      let body: string | undefined
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        if (request.bodyType === 'json') {
          body = request.body
          headers['Content-Type'] = headers['Content-Type'] || 'application/json'
        } else if (request.bodyType === 'text') {
          body = request.body
          headers['Content-Type'] = headers['Content-Type'] || 'text/plain'
        } else if (request.bodyType === 'x-www-form-urlencoded') {
          body = request.body
          headers['Content-Type'] = headers['Content-Type'] || 'application/x-www-form-urlencoded'
        }
      }

      let newResponse: Response

      if (window.electron?.makeRequest) {
        try {
          console.log('Using Electron IPC to make request:', { method: request.method, url, headers })
          newResponse = await window.electron.makeRequest({
            method: request.method,
            url,
            headers,
            body: body || undefined,
          })
          console.log('Electron IPC response:', newResponse)
        } catch (error: any) {
          console.error('Electron IPC error:', error)
          throw new Error(`IPC call failed: ${error.message || 'Unknown error'}`)
        }
      } else {
        throw new Error(
          'This app must be run in Electron to make API requests. ' +
          'Please use the Electron app window, not a regular browser. ' +
          'Run "npm run dev" to start the Electron app.'
        )
      }

      setTabs(prev => prev.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, response: newResponse }
          : tab
      ))

      const historyItem: HistoryItem = {
        id: Date.now().toString(),
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
        tab.id === activeTabId 
          ? { ...tab, response: errorResponse }
          : tab
      ))
      console.error('Request failed:', error)
    }
  }

  const handleSelectRequest = (request: Request) => {
    const existingTab = tabs.find(tab => 
      tab.request.url === request.url && 
      tab.request.method === request.method &&
      tab.request.name === request.name
    )
    if (existingTab) {
      setActiveTabId(existingTab.id)
    } else {
      const newRequest: Request = {
        ...request,
        id: Date.now().toString(),
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
      <div className="app-body">
        <Sidebar
          history={history}
          collections={collections}
          onSelectRequest={handleSelectRequest}
          onCreateCollection={handleCreateCollection}
          onAddRequestToCollection={handleAddRequestToCollection}
          currentRequest={activeTab?.request || null}
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
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App

