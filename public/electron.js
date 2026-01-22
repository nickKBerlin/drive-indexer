const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
const path = require('path');
const isDev = require('electron-is-dev');
const Database = require('./database');

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
    return await db.scanDrive(driveId, drivePath, (progress) => {
      console.log('[IPC] Scan progress:', progress.fileCount);
      if (mainWindow) {
        mainWindow.webContents.send('scan-progress', progress);
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
