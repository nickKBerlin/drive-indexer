const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
const { dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');
const Database = require('./database');
const checkDiskSpace = require('check-disk-space').default;

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
    
    // check-disk-space returns { diskPath, free, size }
    const diskSpace = await checkDiskSpace(rootPath);
    
    return {
      total: diskSpace.size,
      free: diskSpace.free,
      used: diskSpace.size - diskSpace.free,
      freePercentage: Math.round((diskSpace.free / diskSpace.size) * 100),
      usedPercentage: Math.round(((diskSpace.size - diskSpace.free) / diskSpace.size) * 100),
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

// Get available drive letters on the system
ipcMain.handle('get-available-drives', async (event) => {
  try {
    console.log('[IPC] get-available-drives');
    const driveLetters = [];
    
    // Check drive letters from C to Z (skip A and B as they're typically floppy drives)
    for (let i = 67; i <= 90; i++) { // ASCII 67 = 'C', 90 = 'Z'
      const letter = String.fromCharCode(i);
      const drivePath = `${letter}:`;
      
      try {
        // Check if drive exists
        if (fs.existsSync(drivePath)) {
          driveLetters.push(letter);
        }
      } catch (err) {
        // Drive doesn't exist or can't be accessed, skip it
        continue;
      }
    }
    
    console.log('[IPC] Available drives:', driveLetters);
    return driveLetters;
  } catch (err) {
    console.error('[IPC] Error in get-available-drives:', err);
    throw err;
  }
});

// Smart drive detection: finds drive even if drive letter changed
ipcMain.handle('find-drive-location', async (event, driveId) => {
  try {
    console.log('========================================')
    console.log('[IPC] find-drive-location for drive:', driveId);
    
    // Get drive info from database
    const drives = await db.getDrives();
    const drive = drives.find(d => d.id === driveId);
    
    if (!drive) {
      console.log('[IPC] Drive not found in database:', driveId);
      return { connected: false, location: null };
    }
    
    console.log('[IPC] Drive name:', drive.name);
    console.log('[IPC] Stored scanPath:', drive.scanPath);
    console.log('[IPC] File count:', drive.fileCount);
    
    // If no files indexed, cannot verify
    if (!drive.fileCount || drive.fileCount === 0) {
      console.log('[IPC] No files indexed - cannot verify drive identity');
      return { connected: false, location: null };
    }
    
    // Get sample files for verification
    const sampleFiles = await db.getSampleFilesForDrive(driveId, 5);
    
    if (sampleFiles.length === 0) {
      console.log('[IPC] No sample files available');
      return { connected: false, location: null };
    }
    
    console.log('[IPC] Got', sampleFiles.length, 'sample files for verification');
    
    // STEP 1: Try the stored scanPath first
    if (drive.scanPath) {
      console.log('\n[IPC] STEP 1: Checking stored path:', drive.scanPath);
      const matchCount = await checkFilesAtPath(drive.scanPath, sampleFiles);
      const threshold = Math.ceil(sampleFiles.length / 2);
      
      if (matchCount >= threshold) {
        console.log(`[IPC] ✅ Drive found at stored location! (${matchCount}/${sampleFiles.length} files match)`);
        console.log('========================================\n');
        return { connected: true, location: drive.scanPath };
      }
      console.log(`[IPC] ❌ Drive not at stored location (only ${matchCount}/${sampleFiles.length} files match)`);
    }
    
    // STEP 2: Search all available drive letters
    console.log('\n[IPC] STEP 2: Searching all available drive letters...');
    const availableDrives = await getAllAvailableDrives();
    console.log('[IPC] Available drive letters:', availableDrives);
    
    // Extract the relative path structure (everything after drive letter)
    const relativePath = drive.scanPath ? getRelativePath(drive.scanPath) : '';
    console.log('[IPC] Relative path structure:', relativePath);
    
    // Try each available drive letter
    for (const driveLetter of availableDrives) {
      // Construct potential path: DriveLetter + relative structure
      const testPath = relativePath ? `${driveLetter}:/${relativePath}` : `${driveLetter}:`;
      
      // Skip if this is the stored path (already tested)
      if (drive.scanPath && testPath.toLowerCase() === drive.scanPath.toLowerCase()) {
        continue;
      }
      
      console.log(`\n[IPC] Testing drive ${driveLetter}: - ${testPath}`);
      
      // Check if path exists first (quick check)
      if (!fs.existsSync(testPath)) {
        console.log(`[IPC]   Path doesn't exist, skipping`);
        continue;
      }
      
      // Verify files at this location
      const matchCount = await checkFilesAtPath(testPath, sampleFiles);
      const threshold = Math.ceil(sampleFiles.length / 2);
      
      if (matchCount >= threshold) {
        console.log(`[IPC] ✅ DRIVE FOUND at ${driveLetter}: (${matchCount}/${sampleFiles.length} files match)`);
        console.log('========================================\n');
        return { connected: true, location: testPath };
      }
      
      console.log(`[IPC]   Only ${matchCount}/${sampleFiles.length} files match, continuing search...`);
    }
    
    // STEP 3: Not found anywhere
    console.log('\n[IPC] ❌ Drive not found on any available drive letter');
    console.log('========================================\n');
    return { connected: false, location: null };
    
  } catch (err) {
    console.error('[IPC] Error in find-drive-location:', err);
    return { connected: false, location: null };
  }
});

// Helper: Check how many sample files exist at a given path
async function checkFilesAtPath(basePath, sampleFiles) {
  let matchCount = 0;
  
  for (const file of sampleFiles) {
    try {
      // Construct full path
      const normalizedBasePath = basePath.replace(/\\/g, '/').replace(/\/$/, '');
      const normalizedFilePath = file.path.replace(/\\/g, '/');
      const fullPath = `${normalizedBasePath}/${normalizedFilePath}`.replace(/\//g, '\\');
      
      if (fs.existsSync(fullPath)) {
        matchCount++;
        console.log(`[IPC]     ✓ Found: ${file.name}`);
      }
    } catch (err) {
      // File doesn't exist or error accessing
      continue;
    }
  }
  
  return matchCount;
}

// Helper: Extract relative path from full path (remove drive letter)
function getRelativePath(fullPath) {
  if (!fullPath) return '';
  
  // Remove drive letter and colon
  // "H:/Projects/Work" -> "Projects/Work"
  // "C:/Users/Name/Documents" -> "Users/Name/Documents"
  const normalized = fullPath.replace(/\\/g, '/');
  const match = normalized.match(/^[A-Z]:\/?(.*)$/i);
  
  return match ? match[1] : normalized;
}

// Helper: Get all available drives
async function getAllAvailableDrives() {
  const driveLetters = [];
  
  for (let i = 67; i <= 90; i++) { // ASCII 67 = 'C', 90 = 'Z'
    const letter = String.fromCharCode(i);
    const drivePath = `${letter}:`;
    
    try {
      if (fs.existsSync(drivePath)) {
        driveLetters.push(letter);
      }
    } catch (err) {
      continue;
    }
  }
  
  return driveLetters;
}

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

// Show file in Explorer - FIXED to properly highlight file on first click
ipcMain.handle('show-in-folder', async (event, filePath) => {
  try {
    console.log('[IPC] show-in-folder - received path:', filePath);
    
    // Normalize path to use Windows backslashes
    const normalizedPath = path.normalize(filePath);
    console.log('[IPC] Normalized path:', normalizedPath);
    
    // Verify file exists before trying to show it
    if (!fs.existsSync(normalizedPath)) {
      console.error('[IPC] File does not exist:', normalizedPath);
      throw new Error('File not found: ' + normalizedPath);
    }
    
    console.log('[IPC] File exists, showing in Explorer...');
    
    // Use shell.showItemInFolder to open Explorer and highlight the file
    // This method specifically opens the parent folder and selects the item
    shell.showItemInFolder(normalizedPath);
    
    console.log('[IPC] Successfully called showItemInFolder');
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
