import { HistoryItem } from '../types'

const LOCAL_HISTORY_KEY = 'request_history_local'
const MAX_LOCAL_HISTORY_ITEMS = 50

export function saveLocalHistoryItem(historyItem: HistoryItem): void {
  try {
    const existingHistory = loadLocalHistory()
    const updatedHistory = [historyItem, ...existingHistory].slice(0, MAX_LOCAL_HISTORY_ITEMS)
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(updatedHistory))
  } catch (error) {
    console.error('Error saving to local storage:', error)
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('Local storage quota exceeded, clearing old items')
      try {
        const existingHistory = loadLocalHistory()
        const reducedHistory = existingHistory.slice(0, 25)
        localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(reducedHistory))
        const updatedHistory = [historyItem, ...reducedHistory].slice(0, MAX_LOCAL_HISTORY_ITEMS)
        localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(updatedHistory))
      } catch (retryError) {
        console.error('Failed to save after reducing history size:', retryError)
      }
    }
  }
}

export function loadLocalHistory(): HistoryItem[] {
  try {
    const stored = localStorage.getItem(LOCAL_HISTORY_KEY)
    if (!stored) {
      return []
    }
    const history = JSON.parse(stored) as HistoryItem[]
    if (!Array.isArray(history)) {
      return []
    }
    return history
  } catch (error) {
    console.error('Error loading from local storage:', error)
    return []
  }
}

export function deleteLocalHistoryItem(historyItemId: string): void {
  try {
    const existingHistory = loadLocalHistory()
    const updatedHistory = existingHistory.filter(item => item.id !== historyItemId)
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(updatedHistory))
  } catch (error) {
    console.error('Error deleting from local storage:', error)
  }
}

export function clearLocalHistory(): void {
  try {
    localStorage.removeItem(LOCAL_HISTORY_KEY)
  } catch (error) {
    console.error('Error clearing local storage:', error)
  }
}

