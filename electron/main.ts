import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
const RENDERER_DIST = path.join(__dirname, '..', 'dist')

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    icon: path.join(__dirname, './assets/images/mini_painter.png'),
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Points to TypeScript preload
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const startURL = VITE_DEV_SERVER_URL || `file://${path.join(RENDERER_DIST, 'index.html')}`
  mainWindow.loadURL(startURL)

  mainWindow.on('closed', () => {
    mainWindow.destroy()
  })
}

app.on('ready', createMainWindow)

ipcMain.handle('get-save-filename', async () => {
  const saveDir = path.join(app.getPath('documents'), 'MiniPainter', 'saved_models')

  if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir, { recursive: true })
  }

  const { filePath } = await dialog.showSaveDialog({
    title: 'Save Painted Model',
    defaultPath: path.join(saveDir, 'painted_model.gltf'),
    filters: [{ name: 'GLTF Models', extensions: ['gltf'] }],
  })

  return filePath || null
})

ipcMain.handle('save-file', async (_, filePath, data) => {
  if (filePath) {
    fs.writeFileSync(filePath, data)
    return `File saved successfully at ${filePath}`
  }
  return 'No file path provided'
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})
