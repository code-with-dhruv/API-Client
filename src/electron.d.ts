export interface ElectronAPI {
  platform: string
  makeRequest: (requestData: {
    method: string
    url: string
    headers: Record<string, string>
    body?: string
  }) => Promise<any>
}

declare global {
  interface Window {
    electron?: ElectronAPI
  }
}

