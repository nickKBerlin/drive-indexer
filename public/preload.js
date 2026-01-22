const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getDrives: () => ipcRenderer.invoke('get-drives'),
  addDrive: (driveData) => ipcRenderer.invoke('add-drive', driveData),
  updateDrive: (driveId, driveData) => ipcRenderer.invoke('update-drive', driveId, driveData),
  deleteDrive: (driveId) => ipcRenderer.invoke('delete-drive', driveId),
  scanDrive: (driveId, drivePath) => ipcRenderer.invoke('scan-drive', driveId, drivePath),
  searchFiles: (query, filters) => ipcRenderer.invoke('search-files', query, filters),
  getFileStats: (driveId) => ipcRenderer.invoke('get-file-stats', driveId),
  clearDriveFiles: (driveId) => ipcRenderer.invoke('clear-drive-files', driveId),
  onScanProgress: (callback) => ipcRenderer.on('scan-progress', (event, data) => callback(data)),
});
