const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setDarkMode: (isDark) => ipcRenderer.send('set-dark-mode', isDark === true),
});
