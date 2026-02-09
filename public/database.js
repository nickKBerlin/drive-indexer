const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { app } = require('electron');
const { v4: uuidv4 } = require('uuid');
const checkDiskSpace = require('check-disk-space').default;

class Database {
  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'drive-indexer.db');
    console.log('[Database] Creating database at:', dbPath);
    this.db = new sqlite3.Database(dbPath);
    this.initializeDb();
  }

  initializeDb() {
    this.db.serialize(() => {
      // Drives table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS drives (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          scanPath TEXT,
          lastScanned TEXT,
          fileCount INTEGER DEFAULT 0,
          totalSize INTEGER DEFAULT 0,
          freeSpace INTEGER DEFAULT 0,
          createdAt TEXT
        )
      `);

      // Migration: Add scanPath column if it doesn't exist
      this.db.all(`PRAGMA table_info(drives)`, (err, columns) => {
        if (err) {
          console.error('[Database] Error checking columns:', err);
          return;
        }
        
        const hasScanPath = columns.some(col => col.name === 'scanPath');
        if (!hasScanPath) {
          console.log('[Database] ✨ Adding scanPath column (database migration)...');
          this.db.run(`ALTER TABLE drives ADD COLUMN scanPath TEXT`, (err) => {
            if (err) {
              console.error('[Database] Error adding scanPath column:', err);
            } else {
              console.log('[Database] ✅ scanPath column added successfully!');
            }
          });
        } else {
          console.log('[Database] ✅ scanPath column already exists');
        }

        // Migration: Add freeSpace column if it doesn't exist
        const hasFreeSpace = columns.some(col => col.name === 'freeSpace');
        if (!hasFreeSpace) {
          console.log('[Database] ✨ Adding freeSpace column (database migration)...');
          this.db.run(`ALTER TABLE drives ADD COLUMN freeSpace INTEGER DEFAULT 0`, (err) => {
            if (err) {
              console.error('[Database] Error adding freeSpace column:', err);
            } else {
              console.log('[Database] ✅ freeSpace column added successfully!');
            }
          });
        } else {
          console.log('[Database] ✅ freeSpace column already exists');
        }
      });

      // Files table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS files (
          id TEXT PRIMARY KEY,
          driveId TEXT NOT NULL,
          fileName TEXT NOT NULL,
          filePath TEXT NOT NULL,
          fileSize INTEGER,
          fileType TEXT,
          category TEXT,
          modifiedAt TEXT,
          scannedAt TEXT,
          FOREIGN KEY (driveId) REFERENCES drives(id) ON DELETE CASCADE,
          UNIQUE(driveId, filePath)
        )
      `);

      // Create indices for fast searching
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_fileName ON files(fileName)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_fileType ON files(fileType)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_category ON files(category)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_driveId ON files(driveId)`);
    });
  }

  getDrives() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM drives ORDER BY createdAt DESC', (err, rows) => {
        if (err) {
          console.error('[Database] Error in getDrives:', err);
          reject(err);
        } else {
          console.log('[Database] Got', rows?.length || 0, 'drives');
          resolve(rows || []);
        }
      });
    });
  }

  addDrive(driveData) {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const createdAt = new Date().toISOString();
      this.db.run(
        `INSERT INTO drives (id, name, description, createdAt) VALUES (?, ?, ?, ?)`,
        [id, driveData.name, driveData.description || '', createdAt],
        function (err) {
          if (err) {
            console.error('[Database] Error in addDrive:', err);
            reject(err);
          } else {
            console.log('[Database] Drive added:', id);
            resolve({ id, ...driveData, createdAt, fileCount: 0, totalSize: 0, freeSpace: 0 });
          }
        }
      );
    });
  }

  updateDrive(driveId, driveData) {
    return new Promise((resolve, reject) => {
      // Build dynamic SQL based on what fields are provided
      const fields = [];
      const values = [];

      if (driveData.name !== undefined) {
        fields.push('name = ?');
        values.push(driveData.name);
      }
      if (driveData.description !== undefined) {
        fields.push('description = ?');
        values.push(driveData.description || '');
      }
      if (driveData.totalSize !== undefined) {
        fields.push('totalSize = ?');
        values.push(driveData.totalSize);
      }
      if (driveData.freeSpace !== undefined) {
        fields.push('freeSpace = ?');
        values.push(driveData.freeSpace);
      }

      if (fields.length === 0) {
        resolve({ id: driveId, ...driveData });
        return;
      }

      values.push(driveId);
      const sql = `UPDATE drives SET ${fields.join(', ')} WHERE id = ?`;

      this.db.run(sql, values, function (err) {
        if (err) {
          console.error('[Database] Error in updateDrive:', err);
          reject(err);
        } else {
          console.log('[Database] Drive updated:', driveId);
          resolve({ id: driveId, ...driveData });
        }
      });
    });
  }

  deleteDrive(driveId) {
    return new Promise((resolve, reject) => {
      this.db.run(`DELETE FROM drives WHERE id = ?`, [driveId], function (err) {
        if (err) {
          console.error('[Database] Error in deleteDrive:', err);
          reject(err);
        } else {
          console.log('[Database] Drive deleted:', driveId);
          resolve({ success: true });
        }
      });
    });
  }

  // Helper function to check if file/folder should be skipped
  shouldSkipEntry(name) {
    // macOS junk files and folders
    const macOSJunk = [
      '__MACOSX',           // Mac archive metadata folder
      '.DS_Store',          // Mac folder settings
      '.Spotlight-V100',    // Spotlight search index
      '.Trashes',           // Mac trash
      '.fseventsd',         // Mac file system events
      '.TemporaryItems',    // Mac temp files
      '.DocumentRevisions-V100', // Mac document versions
    ];

    // Check exact matches
    if (macOSJunk.includes(name)) {
      return true;
    }

    // Check if file starts with ._ (Mac resource fork)
    if (name.startsWith('._')) {
      return true;
    }

    // Windows junk files
    if (name === 'Thumbs.db' || name === 'desktop.ini') {
      return true;
    }

    return false;
  }

  async scanDrive(driveId, drivePath, progressCallback) {
    try {
      console.log('[Database] Starting async scan of:', drivePath);
      
      // Validate the path
      if (!drivePath || typeof drivePath !== 'string') {
        throw new Error('Invalid drive path');
      }

      // Normalize path
      let normalizedPath = drivePath.trim().replace(/\\/g, '/');
      console.log('[Database] Normalized path:', normalizedPath);

      // Check if path exists (sync check is OK for validation)
      if (!fsSync.existsSync(normalizedPath)) {
        throw new Error(`Path does not exist: ${normalizedPath}`);
      }

      // Get real disk capacity and free space
      let driveCapacity = 0;
      let driveFreeSpace = 0;
      try {
        console.log('[Database] Checking disk space for:', normalizedPath);
        const diskInfo = await checkDiskSpace(normalizedPath);
        driveCapacity = diskInfo.size;  // Total drive capacity in bytes
        driveFreeSpace = diskInfo.free;  // Free space in bytes
        console.log('[Database] Drive capacity:', driveCapacity, 'bytes');
        console.log('[Database] Drive free space:', driveFreeSpace, 'bytes');
      } catch (err) {
        console.error('[Database] Could not read disk space:', err);
        // Continue with scan even if we can't get disk info
      }

      console.log('[Database] Path exists, clearing old files...');
      await this.clearDriveFiles(driveId);

      const scannedAt = new Date().toISOString();
      let fileCount = 0;
      let indexedSize = 0;  // This is sum of indexed files, not used in UI anymore
      let skippedCount = 0;
      const fileBatch = [];
      const BATCH_SIZE = 100;

      const getFileCategory = (ext) => {
        const categoryMap = {
          // Images
          '.jpg': 'Image (JPEG)',
          '.jpeg': 'Image (JPEG)',
          '.png': 'Image (PNG)',
          '.tiff': 'Image (TIFF)',
          '.tif': 'Image (TIFF)',
          '.gif': 'Image (GIF)',
          '.webp': 'Image (WebP)',
          '.bmp': 'Image (BMP)',
          '.svg': 'Vector (SVG)',
          '.raw': 'Image (RAW)',
          '.cr2': 'Image (RAW)',
          '.nef': 'Image (RAW)',
          '.arw': 'Image (RAW)',
          '.dng': 'Image (RAW)',
          
          // Adobe Creative
          '.aep': 'After Effects Project',
          '.prproj': 'Premiere Pro Project',
          '.psd': 'Photoshop',
          '.psb': 'Photoshop',
          '.ai': 'Illustrator',
          '.abr': 'Photoshop Brush',
          '.atn': 'Photoshop Action',
          '.acv': 'Photoshop Curve',
          '.ase': 'Adobe Swatch',
          
          // Video
          '.mp4': 'Video (MP4)',
          '.mov': 'Video (MOV)',
          '.avi': 'Video (AVI)',
          '.mkv': 'Video (MKV)',
          '.prores': 'Video (ProRes)',
          '.m4v': 'Video (M4V)',
          '.mxf': 'Video (Professional)',
          '.dnxhd': 'Video (Professional)',
          
          // Audio
          '.wav': 'Audio (WAV)',
          '.mp3': 'Audio (MP3)',
          '.aiff': 'Audio (AIFF)',
          '.aac': 'Audio (AAC)',
          '.flac': 'Audio (FLAC)',
          '.m4a': 'Audio (M4A)',
          
          // 3D Models
          '.blend': '3D Model (Blender)',
          '.fbx': '3D Model (FBX)',
          '.obj': '3D Model (OBJ)',
          '.c4d': '3D Model (Cinema 4D)',
          '.ma': '3D Model (Maya)',
          '.mb': '3D Model (Maya)',
          '.gltf': '3D Model (glTF)',
          '.glb': '3D Model (glTF)',
          '.stl': '3D Model (STL)',
          '.3ds': '3D Model (3DS)',
          
          // Archives
          '.zip': 'Archive (ZIP)',
          '.rar': 'Archive (RAR)',
          '.7z': 'Archive (7-Zip)',
          '.tar': 'Archive (TAR)',
          '.gz': 'Archive (GZIP)',
          
          // Documents
          '.pdf': 'Document (PDF)',
          '.doc': 'Document (Word)',
          '.docx': 'Document (Word)',
          '.xls': 'Document (Excel)',
          '.xlsx': 'Document (Excel)',
          '.txt': 'Document (Text)',
          
          // Fonts
          '.ttf': 'Font (TrueType)',
          '.otf': 'Font (OpenType)',
        };
        return categoryMap[ext.toLowerCase()] || 'Other';
      };

      const insertBatch = async () => {
        if (fileBatch.length === 0) return;
        
        return new Promise((resolve, reject) => {
          const placeholders = fileBatch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',');
          const values = fileBatch.flat();
          
          this.db.run(
            `INSERT INTO files (id, driveId, fileName, filePath, fileSize, fileType, category, modifiedAt, scannedAt) VALUES ${placeholders}`,
            values,
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      };

      const scanDirectoryAsync = async (dir) => {
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          
          for (const entry of entries) {
            try {
              // Skip macOS and Windows junk files
              if (this.shouldSkipEntry(entry.name)) {
                skippedCount++;
                continue;
              }

              const fullPath = path.join(dir, entry.name);
              
              if (entry.isDirectory()) {
                // Skip system directories
                if (!entry.name.startsWith('.') && entry.name !== 'System Volume Information' && entry.name !== '$RECYCLE.BIN') {
                  await scanDirectoryAsync(fullPath);
                }
              } else {
                const stats = await fs.stat(fullPath);
                const ext = path.extname(entry.name);
                const category = getFileCategory(ext);
                const relativePath = path.relative(normalizedPath, fullPath);
                
                fileBatch.push([
                  uuidv4(),
                  driveId,
                  entry.name,
                  relativePath,
                  stats.size,
                  ext,
                  category,
                  stats.mtime.toISOString(),
                  scannedAt,
                ]);
                
                fileCount++;
                indexedSize += stats.size;
                
                if (fileBatch.length >= BATCH_SIZE) {
                  await insertBatch();
                  fileBatch.length = 0;
                  console.log('[Database] Progress:', fileCount, 'files,', skippedCount, 'skipped');
                  progressCallback({ driveId, fileCount, status: `Scanned ${fileCount} files...` });
                }
              }
            } catch (err) {
              console.warn('[Database] Error processing entry:', entry.name, err.message);
            }
          }
        } catch (err) {
          console.warn('[Database] Error reading directory:', dir, err.message);
        }
      };

      console.log('[Database] Starting async directory scan...');
      await scanDirectoryAsync(normalizedPath);
      
      // Insert remaining files
      if (fileBatch.length > 0) {
        await insertBatch();
      }

      console.log('[Database] Scan complete! Files:', fileCount, 'Skipped junk files:', skippedCount);
      console.log('[Database] Updating drive stats...');
      
      // Update drive stats with REAL disk capacity and free space
      const lastScanned = new Date().toISOString();
      await new Promise((resolve, reject) => {
        this.db.run(
          `UPDATE drives SET fileCount = ?, totalSize = ?, freeSpace = ?, lastScanned = ?, scanPath = ? WHERE id = ?`,
          [fileCount, driveCapacity, driveFreeSpace, lastScanned, normalizedPath, driveId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      console.log('[Database] ✅ Scan complete! Indexed:', fileCount, 'files | Filtered out:', skippedCount, 'junk files');
      console.log('[Database] Drive capacity:', driveCapacity, '| Free space:', driveFreeSpace);
      progressCallback({ driveId, fileCount, status: 'Scan complete!' });
      return { fileCount, totalSize: driveCapacity, freeSpace: driveFreeSpace, lastScanned };
      
    } catch (err) {
      console.error('[Database] Error in async scanDrive:', err);
      throw err;
    }
  }

  searchFiles(query, filters = {}) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT f.*, d.name as driveName, d.scanPath as driveScanPath
        FROM files f
        JOIN drives d ON f.driveId = d.id
        WHERE 1=1
      `;
      const params = [];

      if (query) {
        sql += ` AND f.fileName LIKE ?`;
        params.push(`%${query}%`);
      }

      // Multi-category filter
      if (filters.categories && filters.categories.length > 0) {
        const placeholders = filters.categories.map(() => '?').join(',');
        sql += ` AND f.category IN (${placeholders})`;
        params.push(...filters.categories);
      }

      // Multi-drive filter
      if (filters.driveIds && filters.driveIds.length > 0) {
        const placeholders = filters.driveIds.map(() => '?').join(',');
        sql += ` AND f.driveId IN (${placeholders})`;
        params.push(...filters.driveIds);
      }

      sql += ` ORDER BY f.fileName ASC LIMIT 1000`;

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('[Database] Error in searchFiles:', err);
          reject(err);
        } else {
          console.log('[Database] Search returned', rows?.length || 0, 'results');
          resolve(rows || []);
        }
      });
    });
  }

  getFileStats(driveId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT category, COUNT(*) as count, SUM(fileSize) as totalSize
        FROM files
        WHERE driveId = ?
        GROUP BY category
        ORDER BY count DESC
      `;
      this.db.all(sql, [driveId], (err, rows) => {
        if (err) {
          console.error('[Database] Error in getFileStats:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  clearDriveFiles(driveId) {
    return new Promise((resolve, reject) => {
      this.db.run(`DELETE FROM files WHERE driveId = ?`, [driveId], function (err) {
        if (err) {
          console.error('[Database] Error in clearDriveFiles:', err);
          reject(err);
        } else {
          console.log('[Database] Cleared', this.changes, 'files for drive:', driveId);
          resolve({ deletedCount: this.changes });
        }
      });
    });
  }
}

module.exports = Database;
