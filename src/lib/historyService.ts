import { supabase } from './supabase'
import { HistoryItem } from '../types'

const HISTORY_TABLE = 'request_history'

export interface HistoryRecord {
  id: string
  user_id: string
  request: any
  response: any
  timestamp: number
  created_at?: string
}

export async function saveHistoryItem(userId: string, historyItem: HistoryItem): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from(HISTORY_TABLE)
      .insert({
        id: historyItem.id,
        user_id: userId,
        request: historyItem.request,
        response: historyItem.response,
        timestamp: historyItem.timestamp,
      })

    if (error) {
      console.error('Error saving history item:', error)
      return { error: new Error(error.message) }
    }

    return { error: null }
  } catch (error: any) {
    console.error('Error saving history item:', error)
    return { error: error instanceof Error ? error : new Error(String(error)) }
  }
}

export async function loadUserHistory(userId: string, limit: number = 50): Promise<{ data: HistoryItem[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from(HISTORY_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error loading history:', error)
      return { data: null, error: new Error(error.message) }
    }

    if (!data) {
      return { data: [], error: null }
    }

    const historyItems: HistoryItem[] = data.map((record: HistoryRecord) => ({
      id: record.id,
      request: record.request,
      response: record.response,
      timestamp: record.timestamp,
    }))

    return { data: historyItems, error: null }
  } catch (error: any) {
    console.error('Error loading history:', error)
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

export async function deleteHistoryItem(userId: string, historyItemId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from(HISTORY_TABLE)
      .delete()
      .eq('id', historyItemId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting history item:', error)
      return { error: new Error(error.message) }
    }

    return { error: null }
  } catch (error: any) {
    console.error('Error deleting history item:', error)
    return { error: error instanceof Error ? error : new Error(String(error)) }
  }
}

export async function clearUserHistory(userId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from(HISTORY_TABLE)
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error clearing history:', error)
      return { error: new Error(error.message) }
    }

    return { error: null }
  } catch (error: any) {
    console.error('Error clearing history:', error)
    return { error: error instanceof Error ? error : new Error(String(error)) }
  }
}

