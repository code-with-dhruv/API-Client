import { Environment } from '../types'

const ENVIRONMENTS_KEY = 'api_client_environments'
const ACTIVE_ENVIRONMENT_KEY = 'api_client_active_environment'

interface StoredState {
  environments: Environment[]
}

function readState(): StoredState {
  try {
    const raw = localStorage.getItem(ENVIRONMENTS_KEY)
    if (!raw) return { environments: [] }
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.environments)) return { environments: [] }
    return parsed
  } catch (error) {
    console.error('Error reading environments from local storage:', error)
    return { environments: [] }
  }
}

function writeState(state: StoredState): void {
  try {
    localStorage.setItem(ENVIRONMENTS_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Error saving environments to local storage:', error)
  }
}

export function loadEnvironments(): Environment[] {
  return readState().environments
}

export function saveEnvironments(environments: Environment[]): void {
  writeState({ environments })
}

export function getActiveEnvironmentId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_ENVIRONMENT_KEY)
  } catch {
    return null
  }
}

export function setActiveEnvironmentId(id: string | null): void {
  try {
    if (id === null) {
      localStorage.removeItem(ACTIVE_ENVIRONMENT_KEY)
    } else {
      localStorage.setItem(ACTIVE_ENVIRONMENT_KEY, id)
    }
  } catch (error) {
    console.error('Error saving active environment:', error)
  }
}

/** Flattens an environment's enabled variables into a simple map for interpolation. */
export function resolveVariables(environment: Environment | null | undefined): Record<string, string> {
  if (!environment) return {}
  const map: Record<string, string> = {}
  environment.variables.forEach(v => {
    if (v.enabled && v.key) {
      map[v.key] = v.value
    }
  })
  return map
}
