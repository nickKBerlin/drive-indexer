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
  db = new Database();
  createWindow();
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
ipcMain.handle('get-drives', async () => {
  return db.getDrives();
});

ipcMain.handle('add-drive', async (event, driveData) => {
  return db.addDrive(driveData);
});

ipcMain.handle('update-drive', async (event, driveId, driveData) => {
  return db.updateDrive(driveId, driveData);
});

ipcMain.handle('delete-drive', async (event, driveId) => {
  return db.deleteDrive(driveId);
});

ipcMain.handle('scan-drive', async (event, driveId, drivePath) => {
  return db.scanDrive(driveId, drivePath, (progress) => {
    mainWindow.webContents.send('scan-progress', progress);
  });
});

ipcMain.handle('search-files', async (event, query, filters) => {
  return db.searchFiles(query, filters);
});

ipcMain.handle('get-file-stats', async (event, driveId) => {
  return db.getFileStats(driveId);
});

ipcMain.handle('clear-drive-files', async (event, driveId) => {
  return db.clearDriveFiles(driveId);
});
