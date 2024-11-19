import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const RENDERER_DIST = path.join(__dirname, "..", "dist");
const paletteDir = path.join(app.getPath("documents"), "MiniPainter", "palettes");
let mainWindow = null;
function createMainWindow() {
  mainWindow = new BrowserWindow({
    icon: path.join(__dirname, "./assets/images/mini_painter.png"),
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      // Points to TypeScript preload
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  const startURL = VITE_DEV_SERVER_URL || `file://${path.join(RENDERER_DIST, "index.html")}`;
  mainWindow.loadURL(startURL);
  mainWindow.on("close", async (event) => {
    const isSaved = await (mainWindow == null ? void 0 : mainWindow.webContents.executeJavaScript("window.isModelSaved"));
    if (!isSaved) {
      event.preventDefault();
      if (mainWindow) {
        const { response } = await dialog.showMessageBox(mainWindow, {
          type: "warning",
          buttons: ["Cancel", "Quit Without Saving"],
          defaultId: 0,
          cancelId: 0,
          title: "Unsaved Changes",
          message: "You have unsaved changes. Are you sure you want to quit without saving?"
        });
        if (response === 1) {
          mainWindow.destroy();
        }
      }
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
app.on("ready", createMainWindow);
ipcMain.handle("is-model-saved", async () => {
  return mainWindow == null ? void 0 : mainWindow.webContents.executeJavaScript("window.isModelSaved");
});
ipcMain.handle("get-save-filename", async () => {
  const saveDir = path.join(app.getPath("documents"), "MiniPainter", "saved_models");
  if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir, { recursive: true });
  }
  const { filePath } = await dialog.showSaveDialog({
    title: "Save Painted Model",
    defaultPath: path.join(saveDir, "painted_model.gltf"),
    filters: [{ name: "GLTF Models", extensions: ["gltf"] }]
  });
  return filePath || null;
});
ipcMain.handle("save-file", async (_, filePath, data) => {
  if (filePath) {
    fs.writeFileSync(filePath, data);
    return `File saved successfully at ${filePath}`;
  }
  return "No file path provided";
});
ipcMain.handle("load-file", async (_, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      return null;
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return data;
  } catch (error) {
    console.error(`Error reading file at ${filePath}:`, error);
    throw new Error("Failed to load file");
  }
});
if (!fs.existsSync(paletteDir)) {
  fs.mkdirSync(paletteDir, { recursive: true });
}
ipcMain.handle("save-palette", async (_, palette) => {
  const palettePath = path.join(paletteDir, `${palette.name}.json`);
  fs.writeFileSync(palettePath, JSON.stringify(palette, null, 2));
  return `Palette saved as ${palette.name}`;
});
ipcMain.handle("get-palettes", async () => {
  const files = fs.readdirSync(paletteDir);
  const palettes = files.filter((file) => file.endsWith(".json")).map((file) => {
    const data = fs.readFileSync(path.join(paletteDir, file), "utf-8");
    return JSON.parse(data);
  });
  return palettes;
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
