import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  makeRequest: (requestData: any) => ipcRenderer.invoke('make-request', requestData),
})

