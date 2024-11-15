const { ipcRenderer, contextBridge } = require("electron");
console.log("Preload script loaded successfully");
contextBridge.exposeInMainWorld("electron", {
  saveFile: (filePath, data) => ipcRenderer.invoke("save-file", filePath, data),
  getSaveFilename: () => ipcRenderer.invoke("get-save-filename"),
  on: (...args) => {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off: (...args) => {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send: (...args) => {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke: (...args) => {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  }
  // Add other APIs as needed
});
