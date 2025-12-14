import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import https from 'https'
import http from 'http'
import { URL } from 'url'

let mainWindow: BrowserWindow | null = null

ipcMain.handle('make-request', async (event, requestData) => {
  const { method, url, headers, body } = requestData
  const startTime = Date.now()

  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url)
      const isHttps = urlObj.protocol === 'https:'
      const httpModule = isHttps ? https : http

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: headers || {},
      }

      const req = httpModule.request(options, (res) => {
        let responseData = ''

        res.on('data', (chunk) => {
          responseData += chunk
        })

        res.on('end', () => {
          const responseHeaders: Record<string, string> = {}
          Object.keys(res.headers).forEach((key) => {
            const value = res.headers[key]
            if (value) {
              responseHeaders[key] = Array.isArray(value) ? value.join(', ') : value
            }
          })

          let parsedData: any
          try {
            parsedData = JSON.parse(responseData)
          } catch {
            parsedData = responseData
          }

          resolve({
            status: res.statusCode || 0,
            statusText: res.statusMessage || '',
            headers: responseHeaders,
            data: parsedData,
            time: Date.now() - startTime,
            size: Buffer.byteLength(responseData, 'utf8'),
          })
        })
      })

      req.on('error', (error) => {
        resolve({
          status: 0,
          statusText: 'Error',
          headers: {},
          data: { error: error.message, details: error.stack },
          time: Date.now() - startTime,
          size: 0,
        })
      })

      req.setTimeout(30000, () => {
        req.destroy()
        resolve({
          status: 0,
          statusText: 'Error',
          headers: {},
          data: { error: 'Request timeout' },
          time: Date.now() - startTime,
          size: 0,
        })
      })

      if (body) {
        req.write(body)
      }

      req.end()
    } catch (error: any) {
      resolve({
        status: 0,
        statusText: 'Error',
        headers: {},
        data: { error: error.message, details: error.stack },
        time: Date.now() - startTime,
        size: 0,
      })
    }
  })
})

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1e1e1e',
  })

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

