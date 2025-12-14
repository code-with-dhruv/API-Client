import { supabase } from './supabase'
import { Collection, Request } from '../types'

const COLLECTIONS_TABLE = 'collections'
const COLLECTION_REQUESTS_TABLE = 'collection_requests'

export interface CollectionRecord {
  id: string
  user_id: string
  name: string
  created_at?: string
}

export interface CollectionRequestRecord {
  id: string
  collection_id: string
  user_id: string
  request: any
  created_at?: string
}

export async function createCollection(
  userId: string,
  name: string
): Promise<{ data: Collection | null; error: Error | null }> {
  try {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const { data, error } = await supabase
      .from(COLLECTIONS_TABLE)
      .insert({
        id,
        user_id: userId,
        name: name.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating collection:', error)
      return { data: null, error: new Error(error.message) }
    }

    const collection: Collection = {
      id: data.id,
      name: data.name,
      requests: [],
    }

    return { data: collection, error: null }
  } catch (error: any) {
    console.error('Error creating collection:', error)
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

export async function loadUserCollections(
  userId: string
): Promise<{ data: Collection[] | null; error: Error | null }> {
  try {
    const { data: collectionsData, error: collectionsError } = await supabase
      .from(COLLECTIONS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (collectionsError) {
      console.error('Error loading collections:', collectionsError)
      return { data: null, error: new Error(collectionsError.message) }
    }

    if (!collectionsData || collectionsData.length === 0) {
      return { data: [], error: null }
    }

    const collections: Collection[] = await Promise.all(
      collectionsData.map(async (collectionRecord: CollectionRecord) => {
        const { data: requestsData } = await supabase
          .from(COLLECTION_REQUESTS_TABLE)
          .select('*')
          .eq('collection_id', collectionRecord.id)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        const requests: Request[] = (requestsData || []).map((reqRecord: CollectionRequestRecord) => ({
          ...reqRecord.request,
          id: reqRecord.id,
        }))

        return {
          id: collectionRecord.id,
          name: collectionRecord.name,
          requests,
        }
      })
    )

    return { data: collections, error: null }
  } catch (error: any) {
    console.error('Error loading collections:', error)
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

export async function addRequestToCollection(
  userId: string,
  collectionId: string,
  request: Request
): Promise<{ error: Error | null }> {
  try {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const { error } = await supabase
      .from(COLLECTION_REQUESTS_TABLE)
      .insert({
        id,
        collection_id: collectionId,
        user_id: userId,
        request: {
          ...request,
          id,
        },
      })

    if (error) {
      console.error('Error adding request to collection:', error)
      return { error: new Error(error.message) }
    }

    return { error: null }
  } catch (error: any) {
    console.error('Error adding request to collection:', error)
    return { error: error instanceof Error ? error : new Error(String(error)) }
  }
}

export async function deleteCollection(
  userId: string,
  collectionId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from(COLLECTIONS_TABLE)
      .delete()
      .eq('id', collectionId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting collection:', error)
      return { error: new Error(error.message) }
    }

    return { error: null }
  } catch (error: any) {
    console.error('Error deleting collection:', error)
    return { error: error instanceof Error ? error : new Error(String(error)) }
  }
}

export async function deleteRequestFromCollection(
  userId: string,
  requestId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from(COLLECTION_REQUESTS_TABLE)
      .delete()
      .eq('id', requestId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting request from collection:', error)
      return { error: new Error(error.message) }
    }

    return { error: null }
  } catch (error: any) {
    console.error('Error deleting request from collection:', error)
    return { error: error instanceof Error ? error : new Error(String(error)) }
  }
}

export async function updateCollection(
  userId: string,
  collectionId: string,
  name: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from(COLLECTIONS_TABLE)
      .update({ name: name.trim() })
      .eq('id', collectionId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating collection:', error)
      return { error: new Error(error.message) }
    }

    return { error: null }
  } catch (error: any) {
    console.error('Error updating collection:', error)
    return { error: error instanceof Error ? error : new Error(String(error)) }
  }
}

export async function updateRequestInCollection(
  userId: string,
  requestId: string,
  request: Request
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from(COLLECTION_REQUESTS_TABLE)
      .update({
        request: {
          ...request,
          id: requestId,
        },
      })
      .eq('id', requestId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating request in collection:', error)
      return { error: new Error(error.message) }
    }

    return { error: null }
  } catch (error: any) {
    console.error('Error updating request in collection:', error)
    return { error: error instanceof Error ? error : new Error(String(error)) }
  }
}

