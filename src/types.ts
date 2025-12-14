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

export interface Request {
  id: string
  name: string
  method: HttpMethod
  url: string
  headers: Header[]
  queryParams: QueryParam[]
  body: string
  bodyType: 'json' | 'text' | 'form-data' | 'x-www-form-urlencoded'
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

