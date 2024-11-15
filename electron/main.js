import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Optional Vite dev server URL
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const APP_ROOT = path.join(__dirname, '..');
const RENDERER_DIST = path.join(APP_ROOT, 'dist');

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    icon: path.join(__dirname, './assets/images/mini_painter.png'),
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Adjusted for .js
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the URL based on environment
  const startURL = VITE_DEV_SERVER_URL || `file://${path.join(RENDERER_DIST, 'index.html')}`;
  mainWindow.loadURL(startURL);

  mainWindow.on('closed', () => {
    mainWindow.destroy();
  });
}

app.on('ready', createMainWindow);

ipcMain.handle('get-save-filename', async () => {
  const saveDir = path.join(app.getPath('documents'), 'MiniPainter', 'saved_models');

  if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir, { recursive: true });
  }

  const { filePath } = await dialog.showSaveDialog({
    title: 'Save Painted Model',
    defaultPath: path.join(saveDir, 'painted_model.gltf'),
    filters: [{ name: 'GLTF Models', extensions: ['gltf'] }],
  });

  return filePath || null;
});

ipcMain.handle('save-file', async (_, filePath, data) => {
  if (filePath) {
    fs.writeFileSync(filePath, data);
    return `File saved successfully at ${filePath}`;
  }
  return 'No file path provided';
});

// Handle window lifecycle for macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
