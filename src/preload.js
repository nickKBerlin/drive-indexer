const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getDrives: () => ipcRenderer.invoke('get-drives'),
  addDrive: (driveData) => ipcRenderer.invoke('add-drive', driveData),
  deleteDrive: (driveId) => ipcRenderer.invoke('delete-drive', driveId),
  scanDrive: (driveId, drivePath) => ipcRenderer.invoke('scan-drive', driveId, drivePath),
  searchFiles: (query, filters) => ipcRenderer.invoke('search-files', query, filters),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  onScanProgress: (callback) => ipcRenderer.on('scan-progress', (event, data) => callback(data)),
});
