# 🎬 Drive Indexer

**Find your creative assets across all external drives—even when they're offline.**

A desktop app built with Electron + React that scans your external hard drives and USB storage devices, indexing all files into a searchable database. Know instantly which physical drive contains what you're looking for.

## Features ✨

- **💾 Register Multiple Drives** - Give each external drive a unique name + optional description
- **🔍 Fast Search** - Find files by name across all indexed drives instantly
- **📊 Smart Categories** - Auto-detects After Effects, Premiere Pro, Photoshop, video, audio, fonts, and more
- **📦 Offline Search** - Database persists locally; search works even when drives are unplugged
- **🔄 Re-scan** - Update the database when files change on your drives
- **📈 Drive Stats** - See total files, storage used, last scan date for each drive
- **🏷️ Filter & Sort** - Filter by category, file type, or specific drive

## Why This Exists

You have 9 drives with 20+ TB of design resources. You know you have a file somewhere, but which physical drive?

**Before**: Plug in drives one by one, search manually → 30+ minutes  
**After**: Search in app → 30 seconds

## Tech Stack

- **Electron** - Desktop app framework
- **React** - Modern UI components
- **SQLite** - Local database (fast, no server needed)
- **Node.js** - File system scanning

## Installation & Setup

### Prerequisites

- **Windows 10+** (also works on Mac/Linux)
- **Node.js 16+** - [Download](https://nodejs.org/)
- **npm** - Comes with Node.js

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/nickKBerlin/drive-indexer.git
   cd drive-indexer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the app**
   ```bash
   npm start
   ```

   The Electron app opens automatically.

4. **Test it**
   - Click "+ Add Drive"
   - Give it a name (e.g., "Red External 4TB - Projects")
   - Add an optional description
   - Click "Add Drive"
   - Select the drive, enter path (e.g., `D:/`)
   - Click "Start Scan"
   - Switch to Search tab and find your files!

## How It Works

### 1️⃣ Register a Drive
- Click "+ Add Drive"
- Enter unique name and description
- Drive added to your database

### 2️⃣ Scan the Drive
- Select drive from list
- Enter the drive path:
  - Windows: `D:/`, `E:/`, etc.
  - Mac: `/Volumes/DriveName`
- Click "Start Scan"
- App indexes all files, creates database

### 3️⃣ Search & Find
- Go to Search tab
- Type filename or partial name
- Filter by category or drive (optional)
- Get instant results with which physical drive has the file

### 4️⃣ Update
- Rescan anytime to update database
- New files added, deleted ones removed

## File Categories (Auto-Detected)

**Creative Tools**
- After Effects Projects (.aep)
- Premiere Pro Projects (.prproj)
- Photoshop (.psd, .psb)
- Brushes (.abr), Actions (.atn)
- Adobe Swatches (.ase)

**Media**
- Video (.mp4, .mov, .avi, .mkv, .prores)
- Audio (.wav, .mp3, .aiff, .aac, .flac)
- Images (.jpg, .png, .tiff)

**Other**
- Fonts (.ttf, .otf)
- Documents (.pdf, .doc)
- Vectors (.ai, .eps)

## Database Location

Your search database is stored locally:
- **Windows**: `C:\Users\YourName\AppData\Roaming\Drive Indexer\`
- **Mac**: `~/Library/Application Support/Drive Indexer/`

No cloud sync, no server. Pure local, fast, private.

## Building as Executable

When ready to use as a real Windows app:

```bash
npm run build-win
```

Creates installer + portable exe in `dist/` folder.

## What You'll Learn (Vibe Coding)

Using and modifying this project teaches:

1. **File I/O** - How to read files and folders from drives
2. **Database Design** - SQL queries, indices, relationships
3. **Search Algorithms** - Finding things fast in large datasets
4. **React** - Building interactive user interfaces
5. **Electron** - Creating desktop apps with web tech
6. **Architecture** - How frontend talks to backend

**The best way to learn? Modify it. Change colors, add features, break things, fix them.**

## Troubleshooting

### "Drive path not found"
- Check drive letter (D:, E:, etc.)
- Use forward slashes: `D:/` not `D:\`
- Mac drives on Windows: Check assigned letter from Mac Drive app

### Scan is slow
- Large drives take time (normal)
- Network drives are slower than USB
- 4TB drives might take 5-10 minutes

### Can't find files after scanning
- Make sure scan completed (check file count updated)
- Try partial filename search
- Check you're in right category

### App won't start
- Verify Node.js installed: `node --version`
- Try `npm install` again
- Delete `node_modules`, reinstall

## Next Features to Add

**Easy (Phase 2):**
- Thumbnail previews for images
- Color-code drives
- Export search results
- Recently scanned dashboard

**Medium (Phase 3):**
- Custom user categories
- Favorite files
- Duplicate detection
- Backup checking

**Advanced (Phase 4):**
- Team sharing
- Cloud backup
- Analytics dashboard
- "Haven't used" suggestions

## Resources

- [Electron Docs](https://www.electronjs.org/docs)
- [React Docs](https://react.dev)
- [SQLite Docs](https://www.sqlite.org/docs.html)
- [Node.js File System](https://nodejs.org/api/fs.html)

## License

MIT - Use however you like

---

**Built for creative professionals. Made for learning. 🎬**
