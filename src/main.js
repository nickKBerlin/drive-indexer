const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const database = require('./database');

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const startURL = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  mainWindow.loadURL(startURL);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
};

app.on('ready', async () => {
  console.log('[Electron] App starting...');
  await database.initialize();
  console.log('[Electron] Database initialized');
  createWindow();
  console.log('[Electron] Window created');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC: Get all drives
ipcMain.handle('get-drives', async () => {
  console.log('[IPC] get-drives');
  return await database.getDrives();
});

// IPC: Add new drive
ipcMain.handle('add-drive', async (event, driveData) => {
  console.log('[IPC] add-drive:', driveData.name);
  return await database.addDrive(driveData);
});

// IPC: Delete drive
ipcMain.handle('delete-drive', async (event, driveId) => {
  console.log('[IPC] delete-drive:', driveId);
  return await database.deleteDrive(driveId);
});

// IPC: Scan drive
ipcMain.handle('scan-drive', async (event, driveId, drivePath) => {
  console.log('[IPC] scan-drive:', driveId, drivePath);
  return await database.scanDrive(driveId, drivePath, (progress) => {
    mainWindow.webContents.send('scan-progress', progress);
  });
});

// IPC: Search files
ipcMain.handle('search-files', async (event, query, filters) => {
  console.log('[IPC] search-files:', query, filters);
  return await database.searchFiles(query, filters);
});

// IPC: Select folder (NEW)
ipcMain.handle('select-folder', async (event) => {
  console.log('[IPC] select-folder');
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select a Folder to Index',
    defaultPath: process.env.USERPROFILE || process.env.HOME,
  });
  
  if (result.canceled) {
    return null;
  }
  
  const selectedPath = result.filePaths[0];
  console.log('[IPC] selected-folder:', selectedPath);
  return selectedPath;
});
