import { Request, DEFAULT_AUTH } from '../types'

/**
 * Older saved/synced requests (from history or collections created before
 * auth/form-data support existed) may be missing the newer fields.
 * Always run loaded requests through this before using them, so the rest
 * of the app can assume `formData` and `auth` are always present.
 */
export function withRequestDefaults(request: Request): Request {
  return {
    ...request,
    formData: request.formData ?? [],
    auth: request.auth ?? { ...DEFAULT_AUTH },
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Replaces {{variableName}} tokens with values from the active environment.
 * Unknown variables are left as-is (rather than silently becoming empty
 * strings) so mistakes are visible in the URL/response instead of hidden.
 */
export function interpolateVariables(input: string, variables: Record<string, string>): string {
  if (!input) return input
  return input.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(variables, key) ? variables[key] : match
  })
}

export function findUnresolvedVariables(input: string, variables: Record<string, string>): string[] {
  if (!input) return []
  const found = new Set<string>()
  const regex = /\{\{\s*([\w.-]+)\s*\}\}/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(input)) !== null) {
    if (!Object.prototype.hasOwnProperty.call(variables, match[1])) {
      found.add(match[1])
    }
  }
  return Array.from(found)
}

/** Basic validation before a request goes out, surfaced as one clear error rather than an opaque network failure. */
export function validateRequest(request: Request): string | null {
  if (!request.url || !request.url.trim()) {
    return 'URL is required'
  }
  if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.bodyType === 'json' && request.body?.trim()) {
    try {
      JSON.parse(request.body)
    } catch (e: any) {
      return `Body is not valid JSON: ${e.message || 'parse error'}`
    }
  }
  if (request.auth?.type === 'bearer' && !request.auth.token) {
    return 'Bearer auth is selected but no token was entered'
  }
  if (request.auth?.type === 'basic' && !request.auth.username) {
    return 'Basic auth is selected but no username was entered'
  }
  if (request.auth?.type === 'apiKey' && !request.auth.apiKeyName) {
    return 'API Key auth is selected but no key name was entered'
  }
  return null
}

export function requestToCurl(request: Request): string {
  const parts: string[] = ['curl']
  parts.push(`-X ${request.method}`)

  let url = request.url.trim()
  const enabledParams = (request.queryParams || []).filter(p => p.enabled && p.key)
  if (enabledParams.length > 0) {
    const params = new URLSearchParams()
    enabledParams.forEach(p => params.append(p.key, p.value))
    url += (url.includes('?') ? '&' : '?') + params.toString()
  }
  parts.push(`'${url}'`)

  const headers = (request.headers || []).filter(h => h.enabled && h.key)
  headers.forEach(h => {
    parts.push(`-H '${h.key}: ${h.value.replace(/'/g, "'\\''")}'`)
  })

  if (request.auth?.type === 'bearer' && request.auth.token) {
    parts.push(`-H 'Authorization: Bearer ${request.auth.token}'`)
  } else if (request.auth?.type === 'basic' && request.auth.username) {
    parts.push(`-u '${request.auth.username}:${request.auth.password || ''}'`)
  } else if (request.auth?.type === 'apiKey' && request.auth.apiKeyName) {
    if (request.auth.apiKeyLocation === 'query') {
      // already reflected via query params by the caller if desired
    } else {
      parts.push(`-H '${request.auth.apiKeyName}: ${request.auth.apiKeyValue || ''}'`)
    }
  }

  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    if (request.bodyType === 'form-data' && request.formData?.length) {
      request.formData.filter(f => f.enabled && f.key).forEach(f => {
        parts.push(`-F '${f.key}=${f.value.replace(/'/g, "'\\''")}'`)
      })
    } else if (request.bodyType === 'x-www-form-urlencoded' && request.body) {
      parts.push(`--data '${request.body.replace(/'/g, "'\\''")}'`)
    } else if (request.body) {
      parts.push(`--data-raw '${request.body.replace(/'/g, "'\\''")}'`)
    }
  }

  return parts.join(' \\\n  ')
}
