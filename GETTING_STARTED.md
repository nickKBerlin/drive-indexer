# Getting Started with Drive Indexer

## 🚀 First Time Setup (5 minutes)

### Step 1: Install Node.js

1. Go to [nodejs.org](https://nodejs.org/)
2. Download **LTS version** (18.x or 20.x)
3. Run the installer, click "Next" through all screens
4. When done, open Command Prompt and type:
   ```
   node --version
   ```
   You should see a version number. ✅

### Step 2: Get the Code

1. Open Command Prompt
2. Go to a folder where you want to work:
   ```
   cd Desktop
   ```
3. Clone the repository:
   ```
   git clone https://github.com/nickKBerlin/drive-indexer.git
   cd drive-indexer
   ```

### Step 3: Install Dependencies

Still in Command Prompt:
```
npm install
```

This downloads and installs everything the app needs. It takes 2-3 minutes. Wait for it to finish.

### Step 4: Start the App

```
npm start
```

Two things happen:
1. A browser window opens (development console)
2. The **Drive Indexer app window** opens

🎉 **You're running the app!**

---

## 📝 First Test: Index One Drive

1. **Add a drive**
   - Click "+ Add Drive" button
   - Name: `Test Drive` (or whatever you like)
   - Description: `My first test` (optional)
   - Click "Add Drive"

2. **Scan it**
   - Click on the drive card
   - A "Scan" panel appears below
   - Enter path:
     - **Windows**: `D:/` (or `E:/`, `F:/` - whatever your external drive is)
     - **Mac**: `/Volumes/YourDriveName`
   - Click "Start Scan"
   - Wait for progress to show "Scan complete!"

3. **Search for files**
   - Click "Search" tab at top
   - Type a filename or partial name (e.g., ".psd" or "project")
   - Click "Search"
   - See results with which drive they're on!

---

## 🎯 Your Real Workflow

Once you're comfortable:

1. **Add all 9 of your drives**
   - Red External 4TB - Projects
   - Blue External 2TB - Archive
   - etc.
   - Use custom names so you remember which is which

2. **Scan each one**
   - This is one-time work (mostly)
   - Takes time for large drives (2-6 hours for multiple 4TB drives)
   - But you only do it once!

3. **Search whenever you need something**
   - Open app (it's instant)
   - Type what you're looking for
   - See which drive has it
   - Plug in that drive
   - Go directly to the file

4. **Re-scan if you change files**
   - If you add/delete files on a drive
   - Rescan that drive to update database
   - Takes 5-10 minutes per drive

---

## 🐛 Common Issues

### "npm is not recognized"
**Problem**: Command prompt doesn't know what npm is  
**Solution**: 
1. Restart Command Prompt (close and reopen)
2. If still doesn't work, restart your computer
3. If STILL doesn't work, Node.js didn't install right - reinstall it

### "Port 3000 already in use"
**Problem**: Something else is using port 3000  
**Solution**: Just close it and try again, or:
```
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Scan is stuck
**Problem**: Scan seems to hang  
**Solution**: This is normal for huge drives. Wait 30+ minutes. If it's been 2 hours, it might be frozen - close the app and try again.

### "Drive not found" error
**Problem**: App can't access your drive path  
**Solution**:
1. Make sure drive is actually connected
2. Try path with backslashes: `D:\\` (Windows)
3. Check the drive letter in File Explorer

---

## 🧠 Next Steps: Learn Vibe Coding

Now that you have a working app:

1. **Understand the pieces**:
   - Open the folder in a code editor (VS Code recommended)
   - Explore `src/` folder - that's React (UI)
   - `public/electron.js` - that's the main process
   - `public/database.js` - that's SQLite (database)

2. **Try small changes**:
   - Change the title from "Drive Indexer" to "My File Finder"
   - Change colors in `src/App.css`
   - Add a new category in `database.js`

3. **Build features**:
   - Add thumbnails for image files
   - Color-code different drive types
   - Export search results

4. **Share improvements**:
   - Push changes to GitHub
   - See how proud you'll be!

---

## 📚 Resources

- **Electron docs**: https://www.electronjs.org/docs
- **React tutorial**: https://react.dev/learn
- **VS Code editor**: https://code.visualstudio.com/
- **JavaScript basics**: https://javascript.info/

---

## ✅ You're Ready!

You now have a functioning desktop app that solves a real problem for you.

**That's vibe coding.**

Start simple, iterate, learn by doing. Add features as you need them. Ask questions when stuck.

Most importantly: **Use it**. Actually search your drives. Feel the speed and usefulness. That's your feedback loop.

🚀 Happy coding!
