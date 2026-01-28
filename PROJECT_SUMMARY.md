# Drive Indexer - Project Summary & Documentation

## 1. PRODUCT GOAL

**Drive Indexer** is a desktop application for Windows that enables fast, intelligent indexing and searching of files across multiple local and external drives (USB drives, external SSDs, network storage).

### Vision Statement
"Empower creative professionals and power users to instantly locate any file across their entire ecosystem of drives - eliminating the frustration of searching through dozens of external storage devices."

### Core Value Proposition
- **Fast Search**: Index hundreds of thousands of files and search instantly
- **Smart Organization**: Automatic file categorization (35+ file types)
- **Multi-Drive Management**: Search across or exclude specific drives
- **Developer-First**: Built with modern tech (Electron, React, SQLite)
- **Clean Results**: Filters out system junk automatically

---

## 2. PRODUCT BACKLOG WITH USER STORIES

### Completed Features ✅

#### PBI-001: Drive Management
**Description**: Users can add multiple drives to the indexer and manage them

**User Stories**:
- US-001-A: As a creative professional, I want to add external drives to the app so that I can index multiple storage locations
- US-001-B: As a user, I want to see my drives listed with file counts so that I can understand what's indexed
- US-001-C: As a user, I want to delete drives from the app so that I can remove old or unused storage devices

**Status**: ✅ Complete

---

#### PBI-002: Background File Scanning
**Description**: Scan drives without blocking the UI, with real-time progress feedback

**User Stories**:
- US-002-A: As a user, I want to scan drives in the background so that the app stays responsive
- US-002-B: As a user, I want to see scanning progress in real-time so that I know how long it will take
- US-002-C: As a creative professional, I want to scan massive drives (100GB+) without the app freezing

**Status**: ✅ Complete

---

#### PBI-003: File Categorization (35+ Types)
**Description**: Automatically categorize files by type (JPEG, PNG, Blender, After Effects, etc.)

**User Stories**:
- US-003-A: As a video editor, I want files automatically categorized by format so I can find my Premiere Pro projects quickly
- US-003-B: As a motion designer, I want to see detailed categories (e.g., "3D Model (Blender)" not just "3D") so I can target specific file types
- US-003-C: As a photographer, I want RAW files grouped separately so I can manage my raw images

**Status**: ✅ Complete

---

#### PBI-004: Smart Search with Filters
**Description**: Search by filename with optional category and drive filters

**User Stories**:
- US-004-A: As a user, I want to search by filename so I can find files quickly without remembering exact paths
- US-004-B: As a user, I want to filter search results by file type so I find only PNGs or only Blender files
- US-004-C: As a user, I want to filter by drive so I can exclude slow external drives from my search
- US-004-D: As a user, I want to search across all drives simultaneously so I don't have to search each drive separately

**Status**: ✅ Complete

---

#### PBI-005: Multi-Drive Checkboxes
**Description**: Select which drives to include in search via checkboxes

**User Stories**:
- US-005-A: As a user, I want to select/deselect drives via checkboxes so I can exclude slow drives from searches
- US-005-B: As a user, I want "All Drives" checkbox that toggles all drives at once so I don't have to click each one
- US-005-C: As a user, I want to see file counts per drive so I understand which drives have more content

**Status**: ✅ Complete

---

#### PBI-006: Multi-Category Checkboxes
**Description**: Select which file categories to include in search via hierarchical checkboxes

**User Stories**:
- US-006-A: As a user, I want to select specific categories (Image (PNG), Audio (WAV)) so I find exactly what I need
- US-006-B: As a user, I want "All Categories" to quickly include all file types so I can switch between focused and broad searches
- US-006-C: As a user, I want a scrollable category list so I can see all 35+ category options without overwhelming the UI

**Status**: ✅ Complete

---

#### PBI-007: Show File in Explorer
**Description**: Open file's folder in Windows Explorer with file pre-selected

**User Stories**:
- US-007-A: As a user, I want to open a file's folder in Explorer from search results so I can work with it immediately
- US-007-B: As a user, I want to access the context menu for the file so I can perform Windows operations (copy, move, delete)

**Status**: ✅ Complete

---

#### PBI-008: Smart Path Detection (Auto-Folder Opening)
**Description**: Automatically detect if drive is still connected and open folder without modal if path valid

**User Stories**:
- US-008-A: As a user with USB drives that stay in one slot, I want the app to remember which drive is which so I can open files with one click
- US-008-B: As a user who swaps USB drives between slots, I want a modal asking for the current drive letter so I can tell the app where the files moved to
- US-008-C: As a user, I want the app to check if my drive is connected before trying to open it so I don't get errors

**Status**: ✅ Complete

---

#### PBI-009: Database Migration for scanPath
**Description**: Automatically add scanPath column to existing databases on app startup

**User Stories**:
- US-009-A: As an existing user, I want the app to automatically update my database so I don't lose my indexed files

**Status**: ✅ Complete

---

#### PBI-010: Mac OS Junk File Filtering
**Description**: Automatically exclude Mac OS resource fork files and metadata folders from indexing

**User Stories**:
- US-010-A: As a user who receives ZIP files from Mac users, I want junk files (._01.wav) automatically filtered so my search results are clean
- US-010-B: As a user, I want __MACOSX folders excluded so I don't see metadata artifacts
- US-010-C: As a user, I want smaller database and faster scanning so I don't waste storage on Mac junk

**Status**: ✅ Complete

---

#### PBI-011: Sortable Results Table
**Description**: Click column headers to sort search results by filename, size, date, category, or drive

**User Stories**:
- US-011-A: As a user, I want to sort results by file size so I can find my largest files
- US-011-B: As a user, I want to sort by modification date so I can find recent files
- US-011-C: As a user, I want to toggle between ascending/descending so I can see both largest/smallest and newest/oldest

**Status**: ✅ Complete

---

### Planned Features 🔜

#### PBI-012: Advanced Filters (Date & Size Range)
**Priority**: HIGH | **Effort**: 30 min

#### PBI-013: File Preview / Thumbnails
**Priority**: MEDIUM | **Effort**: 1-2 hours

#### PBI-014: Network Drive Support
**Priority**: MEDIUM | **Effort**: 1-2 hours

#### PBI-015: Grouped Category UI (Expandable Tree)
**Priority**: LOW | **Effort**: 1 hour

#### PBI-016: Export Search Results
**Priority**: LOW | **Effort**: 1-2 hours

#### PBI-017: Favorites / Bookmarks
**Priority**: LOW | **Effort**: 1-2 hours

#### PBI-018: Drive Health Monitoring
**Priority**: LOW | **Effort**: 2-3 hours

#### PBI-019: Batch Operations
**Priority**: LOW | **Effort**: 3-4 hours

---

## 3. TECHNICAL PRODUCTION DOCUMENTATION

### Technology Stack
```
Frontend: React 18.x, CSS3, Electron Renderer
Backend: Electron Main, Node.js, SQLite 3
Desktop: Electron with IPC
```

### Database Schema

**Drives Table**
```sql
id (UUID), name, description, scanPath, lastScanned, 
fileCount, totalSize, createdAt
```

**Files Table**
```sql
id, driveId (FK), fileName, filePath, fileSize, fileType,
category, modifiedAt, scannedAt

INDEXES: fileName, fileType, category, driveId
```

### Key Functions

**Database Class**:
- `getDrives()` - Get all drives
- `addDrive(driveData)` - Add drive
- `scanDrive(driveId, drivePath, progressCallback)` - Scan drive
- `searchFiles(query, filters)` - Search files
- `shouldSkipEntry(name)` - Filter junk files

### File Categories (35+)

- **Images**: JPEG, PNG, TIFF, GIF, WebP, RAW
- **Video**: MP4, MOV, AVI, MKV, ProRes, Professional
- **Audio**: WAV, MP3, AIFF, FLAC, AAC
- **3D Models**: Blender, FBX, OBJ, Cinema 4D, Maya, glTF, STL
- **Adobe**: After Effects, Premiere, Photoshop, Illustrator
- **Archives**: ZIP, RAR, 7-Zip, TAR
- **Documents**: PDF, Word, Excel, Text
- **Fonts**: TrueType, OpenType

### Junk Files Filtered

**macOS**: `._*`, `__MACOSX`, `.DS_Store`, `.Spotlight-V100`, `.Trashes`, `.fseventsd`  
**Windows**: `Thumbs.db`, `desktop.ini`  
**System**: Hidden dirs, `System Volume Information`, `$RECYCLE.BIN`

### Git Status

Latest commits:
- ✅ Filter out macOS junk files (9645f6a)
- ✅ Add detailed categories + multi-select filters (76edc32)
- ✅ Add scanPath migration (fdaa978)

### Getting Started (Next Thread)

```bash
git clone https://github.com/nickKBerlin/drive-indexer.git
npm install
npm start
```

Database: `%APPDATA%/drive-indexer/drive-indexer.db`

---

**Last Updated**: January 28, 2026  
**Status**: MVP Complete + Advanced Features Planned
