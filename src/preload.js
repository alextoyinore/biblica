const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe, minimal IPC bridge to the renderer
contextBridge.exposeInMainWorld('electronAPI', {
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (_event, action) => callback(action));
    // Return a cleanup function
    return () => ipcRenderer.removeAllListeners('menu-action');
  },
});
