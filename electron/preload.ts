const { ipcRenderer, contextBridge } = require('electron');
console.log('Preload script loaded successfully');

contextBridge.exposeInMainWorld('electron', {
  saveFile: (filePath: string, data: any) => ipcRenderer.invoke('save-file', filePath, data),
  getSaveFilename: () => ipcRenderer.invoke('get-save-filename'),
  loadFile: (filePath: string) => ipcRenderer.invoke('load-file', filePath),

  on: (...args: Parameters<typeof ipcRenderer.on>) => {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args));
  },
  off: (...args: Parameters<typeof ipcRenderer.off>) => {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send: (...args: Parameters<typeof ipcRenderer.send>) => {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke: (...args: Parameters<typeof ipcRenderer.invoke>) => {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  }
  // Add other APIs as needed
});
