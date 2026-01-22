const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const { v4: uuidv4 } = require('uuid');

class Database {
  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'drive-indexer.db');
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
        if (err) reject(err);
        else resolve(rows || []);
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
          if (err) reject(err);
          else resolve({ id, ...driveData, createdAt, fileCount: 0, totalSize: 0 });
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
          if (err) reject(err);
          else resolve({ id: driveId, ...driveData });
        }
      );
    });
  }

  deleteDrive(driveId) {
    return new Promise((resolve, reject) => {
      this.db.run(`DELETE FROM drives WHERE id = ?`, [driveId], function (err) {
        if (err) reject(err);
        else resolve({ success: true });
      });
    });
  }

  scanDrive(driveId, drivePath, progressCallback) {
    return new Promise(async (resolve, reject) => {
      try {
        // Clear old files for this drive
        await this.clearDriveFiles(driveId);

        const scannedAt = new Date().toISOString();
        let fileCount = 0;
        let totalSize = 0;
        let processedCount = 0;

        const getFileCategory = (ext) => {
          const categoryMap = {
            '.aep': 'After Effects Project',
            '.prproj': 'Premiere Pro Project',
            '.psd': 'Photoshop',
            '.psb': 'Photoshop',
            '.abr': 'Photoshop Brush',
            '.atn': 'Photoshop Action',
            '.acv': 'Photoshop Curve',
            '.ase': 'Adobe Swatch',
            '.mp4': 'Video',
            '.mov': 'Video',
            '.avi': 'Video',
            '.mkv': 'Video',
            '.prores': 'Video',
            '.m4v': 'Video',
            '.wav': 'Audio',
            '.mp3': 'Audio',
            '.aiff': 'Audio',
            '.aac': 'Audio',
            '.flac': 'Audio',
            '.jpg': 'Image',
            '.jpeg': 'Image',
            '.png': 'Image',
            '.tiff': 'Image',
            '.tif': 'Image',
            '.psd': 'Image',
            '.ai': 'Vector',
            '.eps': 'Vector',
            '.pdf': 'Document',
            '.doc': 'Document',
            '.docx': 'Document',
            '.ttf': 'Font',
            '.otf': 'Font',
            '.txt': 'Text',
          };
          return categoryMap[ext.toLowerCase()] || 'Other';
        };

        const scanDirectory = (dir, callback) => {
          fs.readdir(dir, { withFileTypes: true }, (err, files) => {
            if (err) {
              callback();
              return;
            }

            let pending = files.length;
            if (pending === 0) {
              callback();
              return;
            }

            files.forEach((file) => {
              const fullPath = path.join(dir, file.name);
              const relativePath = path.relative(drivePath, fullPath);

              if (file.isDirectory()) {
                scanDirectory(fullPath, () => {
                  pending--;
                  if (pending === 0) callback();
                });
              } else {
                try {
                  const stats = fs.statSync(fullPath);
                  const ext = path.extname(file.name);
                  const category = getFileCategory(ext);
                  const fileId = uuidv4();

                  this.db.run(
                    `INSERT INTO files (id, driveId, fileName, filePath, fileSize, fileType, category, modifiedAt, scannedAt)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                      fileId,
                      driveId,
                      file.name,
                      relativePath,
                      stats.size,
                      ext,
                      category,
                      stats.mtime.toISOString(),
                      scannedAt,
                    ],
                    () => {
                      fileCount++;
                      totalSize += stats.size;
                      processedCount++;
                      if (processedCount % 100 === 0) {
                        progressCallback({ fileCount, status: `Scanned ${fileCount} files...` });
                      }
                      pending--;
                      if (pending === 0) callback();
                    }
                  );
                } catch (e) {
                  pending--;
                  if (pending === 0) callback();
                }
              }
            });
          });
        };

        scanDirectory(drivePath, () => {
          // Update drive stats
          const lastScanned = new Date().toISOString();
          this.db.run(
            `UPDATE drives SET fileCount = ?, totalSize = ?, lastScanned = ? WHERE id = ?`,
            [fileCount, totalSize, lastScanned, driveId],
            () => {
              progressCallback({ fileCount, status: 'Scan complete!' });
              resolve({ fileCount, totalSize, lastScanned });
            }
          );
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  searchFiles(query, filters = {}) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT f.*, d.name as driveName, d.description as driveDescription
        FROM files f
        JOIN drives d ON f.driveId = d.id
        WHERE 1=1
      `;
      const params = [];

      if (query) {
        sql += ` AND f.fileName LIKE ?`;
        params.push(`%${query}%`);
      }

      if (filters.category && filters.category !== 'All') {
        sql += ` AND f.category = ?`;
        params.push(filters.category);
      }

      if (filters.driveId) {
        sql += ` AND f.driveId = ?`;
        params.push(filters.driveId);
      }

      if (filters.fileType) {
        sql += ` AND f.fileType = ?`;
        params.push(filters.fileType);
      }

      sql += ` ORDER BY f.fileName ASC LIMIT 1000`;

      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
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
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  clearDriveFiles(driveId) {
    return new Promise((resolve, reject) => {
      this.db.run(`DELETE FROM files WHERE driveId = ?`, [driveId], function (err) {
        if (err) reject(err);
        else resolve({ deletedCount: this.changes });
      });
    });
  }
}

module.exports = Database;
