const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { app } = require('electron');
const { v4: uuidv4 } = require('uuid');

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
          lastScanned TEXT,
          fileCount INTEGER DEFAULT 0,
          totalSize INTEGER DEFAULT 0,
          createdAt TEXT
        )
      `);

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
            resolve({ id, ...driveData, createdAt, fileCount: 0, totalSize: 0 });
          }
        }
      );
    });
  }

  updateDrive(driveId, driveData) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE drives SET name = ?, description = ? WHERE id = ?`,
        [driveData.name, driveData.description || '', driveId],
        function (err) {
          if (err) {
            console.error('[Database] Error in updateDrive:', err);
            reject(err);
          } else {
            resolve({ id: driveId, ...driveData });
          }
        }
      );
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

      console.log('[Database] Path exists, clearing old files...');
      await this.clearDriveFiles(driveId);

      const scannedAt = new Date().toISOString();
      let fileCount = 0;
      let totalSize = 0;
      const fileBatch = [];
      const BATCH_SIZE = 100;

      const getFileCategory = (ext) => {
        const categoryMap = {
          '.aep': 'After Effects Project',
          '.prproj': 'Premiere Pro Project',
          '.psd': 'Photoshop',
          '.psb': 'Photoshop',
          '.abr': 'Photoshop Brush',
          '.atn': 'Photoshop Action',
          '.mp4': 'Video',
          '.mov': 'Video',
          '.avi': 'Video',
          '.mkv': 'Video',
          '.wav': 'Audio',
          '.mp3': 'Audio',
          '.jpg': 'Image',
          '.jpeg': 'Image',
          '.png': 'Image',
          '.ai': 'Vector',
          '.pdf': 'Document',
          '.ttf': 'Font',
          '.otf': 'Font',
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
                totalSize += stats.size;
                
                if (fileBatch.length >= BATCH_SIZE) {
                  await insertBatch();
                  fileBatch.length = 0;
                  console.log('[Database] Progress:', fileCount, 'files');
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

      console.log('[Database] Scan complete, updating drive stats...');
      
      // Update drive stats
      const lastScanned = new Date().toISOString();
      await new Promise((resolve, reject) => {
        this.db.run(
          `UPDATE drives SET fileCount = ?, totalSize = ?, lastScanned = ? WHERE id = ?`,
          [fileCount, totalSize, lastScanned, driveId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      console.log('[Database] Async scan complete! Files:', fileCount);
      progressCallback({ driveId, fileCount, status: 'Scan complete!' });
      return { fileCount, totalSize, lastScanned };
      
    } catch (err) {
      console.error('[Database] Error in async scanDrive:', err);
      throw err;
    }
  }

  searchFiles(query, filters = {}) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT f.*, d.name as driveName
        FROM files f
        JOIN drives d ON f.driveId = d.id
        WHERE 1=1
      `;
      const params = [];

      if (query) {
        sql += ` AND f.fileName LIKE ?`;
        params.push(`%${query}%`);
      }

      if (filters.category) {
        sql += ` AND f.category = ?`;
        params.push(filters.category);
      }

      if (filters.driveId) {
        sql += ` AND f.driveId = ?`;
        params.push(filters.driveId);
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
