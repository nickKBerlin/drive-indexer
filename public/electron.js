const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
const { dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');
const Database = require('./database');
const diskusage = require('diskusage');

let mainWindow;
let db;

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
    },
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  console.log('[Electron] App starting...');
  try {
    db = new Database();
    console.log('[Electron] Database initialized');
    createWindow();
    console.log('[Electron] Window created');
  } catch (err) {
    console.error('[Electron] Error in app.on(ready):', err);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Helper function to get disk space info
async function getDiskSpaceInfo(drivePath) {
  try {
    console.log('[Electron] Getting disk space for:', drivePath);
    
    // Extract root path (e.g., 'D:' from 'D:\\path\\to\\folder')
    let rootPath = drivePath;
    if (drivePath.includes(':')) {
      rootPath = drivePath.split(':')[0] + ':';
    }
    
    const info = await diskusage.check(rootPath);
    
    return {
      total: info.total,
      free: info.free,
      used: info.total - info.free,
      freePercentage: Math.round((info.free / info.total) * 100),
      usedPercentage: Math.round(((info.total - info.free) / info.total) * 100),
    };
  } catch (err) {
    console.error('[Electron] Error getting disk space:', err);
    throw err;
  }
}

// IPC Handlers
ipcMain.handle('get-drives', async (event) => {
  try {
    console.log('[IPC] get-drives');
    return await db.getDrives();
  } catch (err) {
    console.error('[IPC] Error in get-drives:', err);
    throw err;
  }
});

ipcMain.handle('add-drive', async (event, driveData) => {
  try {
    console.log('[IPC] add-drive:', driveData.name);
    return await db.addDrive(driveData);
  } catch (err) {
    console.error('[IPC] Error in add-drive:', err);
    throw err;
  }
});

ipcMain.handle('update-drive', async (event, driveId, driveData) => {
  try {
    console.log('[IPC] update-drive:', driveId);
    return await db.updateDrive(driveId, driveData);
  } catch (err) {
    console.error('[IPC] Error in update-drive:', err);
    throw err;
  }
});

ipcMain.handle('delete-drive', async (event, driveId) => {
  try {
    console.log('[IPC] delete-drive:', driveId);
    return await db.deleteDrive(driveId);
  } catch (err) {
    console.error('[IPC] Error in delete-drive:', err);
    throw err;
  }
});

ipcMain.handle('scan-drive', async (event, driveId, drivePath) => {
  try {
    console.log('[IPC] scan-drive:', drivePath);
    
    // Get disk space info before scanning
    const diskInfo = await getDiskSpaceInfo(drivePath);
    console.log('[IPC] Disk info:', diskInfo);
    
    // Update drive with disk space info
    await db.updateDrive(driveId, {
      totalSize: diskInfo.total,
      freeSpace: diskInfo.free,
    });
    
    return await db.scanDrive(driveId, drivePath, (progress) => {
      console.log('[IPC] Scan progress:', progress.fileCount);
      if (mainWindow) {
        mainWindow.webContents.send('scan-progress', { driveId, ...progress });
      }
    });
  } catch (err) {
    console.error('[IPC] Error in scan-drive:', err);
    throw err;
  }
});

ipcMain.handle('search-files', async (event, query, filters) => {
  try {
    console.log('[IPC] search-files:', query);
    return await db.searchFiles(query, filters);
  } catch (err) {
    console.error('[IPC] Error in search-files:', err);
    throw err;
  }
});

ipcMain.handle('get-file-stats', async (event, driveId) => {
  try {
    console.log('[IPC] get-file-stats:', driveId);
    return await db.getFileStats(driveId);
  } catch (err) {
    console.error('[IPC] Error in get-file-stats:', err);
    throw err;
  }
});

ipcMain.handle('clear-drive-files', async (event, driveId) => {
  try {
    console.log('[IPC] clear-drive-files:', driveId);
    return await db.clearDriveFiles(driveId);
  } catch (err) {
    console.error('[IPC] Error in clear-drive-files:', err);
    throw err;
  }
});

// Get disk space for a path
ipcMain.handle('get-disk-space', async (event, drivePath) => {
  try {
    console.log('[IPC] get-disk-space:', drivePath);
    const info = await getDiskSpaceInfo(drivePath);
    console.log('[IPC] Disk space info retrieved:', info);
    return info;
  } catch (err) {
    console.error('[IPC] Error in get-disk-space:', err);
    throw err;
  }
});

// Select Folder Dialog
ipcMain.handle('select-folder', async (event) => {
  try {
    console.log('[IPC] select-folder');
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select a Folder to Index',
      defaultPath: process.env.USERPROFILE || process.env.HOME,
    });
    
    if (result.canceled) {
      console.log('[IPC] Folder selection canceled');
      return null;
    }
    
    const selectedPath = result.filePaths[0];
    console.log('[IPC] Selected folder:', selectedPath);
    return selectedPath;
  } catch (err) {
    console.error('[IPC] Error in select-folder:', err);
    throw err;
  }
});

// Show file in Explorer
ipcMain.handle('show-in-folder', async (event, filePath) => {
  try {
    console.log('[IPC] show-in-folder:', filePath);
    shell.showItemInFolder(filePath);
    return { success: true };
  } catch (err) {
    console.error('[IPC] Error in show-in-folder:', err);
    throw err;
  }
});

// Check if path exists
ipcMain.handle('check-path-exists', async (event, checkPath) => {
  try {
    console.log('[IPC] check-path-exists:', checkPath);
    const exists = fs.existsSync(checkPath);
    console.log('[IPC] Path exists:', exists);
    return exists;
  } catch (err) {
    console.error('[IPC] Error in check-path-exists:', err);
    return false;
  }
});
