export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export interface Header {
  id: string
  key: string
  value: string
  enabled: boolean
}

export interface QueryParam {
  id: string
  key: string
  value: string
  enabled: boolean
}

export interface FormDataField {
  id: string
  key: string
  value: string
  enabled: boolean
}

export type AuthType = 'none' | 'bearer' | 'basic' | 'apiKey'

export interface AuthConfig {
  type: AuthType
  token?: string
  username?: string
  password?: string
  apiKeyName?: string
  apiKeyValue?: string
  apiKeyLocation?: 'header' | 'query'
}

export const DEFAULT_AUTH: AuthConfig = { type: 'none' }

export interface Request {
  id: string
  name: string
  method: HttpMethod
  url: string
  headers: Header[]
  queryParams: QueryParam[]
  body: string
  bodyType: 'json' | 'text' | 'form-data' | 'x-www-form-urlencoded'
  formData?: FormDataField[]
  auth?: AuthConfig
}

export interface Environment {
  id: string
  name: string
  variables: { id: string; key: string; value: string; enabled: boolean }[]
}

export interface Response {
  status: number
  statusText: string
  headers: Record<string, string>
  data: any
  time: number
  size: number
}

export interface Collection {
  id: string
  name: string
  requests: Request[]
}

export interface HistoryItem {
  id: string
  request: Request
  response: Response
  timestamp: number
}

