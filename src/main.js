const { app, BrowserWindow, ipcMain, dialog, nativeImage } = require('electron/main')
const path = require('node:path')
const fs = require('fs').promises;

// Auto-updater - only load in production
let autoUpdater;
if (process.env.NODE_ENV !== 'development') {
  const { autoUpdater: updater } = require('electron-updater');
  autoUpdater = updater;
  
  // Configure auto-updater
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
}

ipcMain.handle('dialog:save-text-file', async (event, content, defaultFilename = 'untitledTab.txt') => {
  const { window } = BrowserWindow.fromWebContents(event.sender);

  try {
    const result = await dialog.showSaveDialog(window, {
      title: 'Save Tab',
      defaultFilename: defaultFilename,
      filters: [
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['createDirectory']
    });

    if (result.canceled || !result.filePath){
      return false;
    }

    await fs.writeFile(result.filePath, content, 'utf-8');
    return true;

  } catch (err) {

    console.error('failed to save file:', err);
    return false;
  }
})

ipcMain.handle('dialog:import-file', async (event) => {
  const { window } = BrowserWindow.fromWebContents(event.sender);

  try {
    const result = await dialog.showOpenDialog(window, {
      title: 'Open File',
      properties: ['openFile', 'dontAddToRecent'],
      filters: [
        { name: 'Text Files', extensions: ['txt'] }
      ],
    })

    if (result.canceled || !result.filePaths.length){
      return false;
    }

    const fh = await fs.open(result.filePaths.at(0), 'r');
    const textbuf = await fh.readFile({encoding: 'utf8'});
    fh.close();
    return {contents: textbuf, extension: result.filePaths[0].substring(result.filePaths[0].length - 3)};

  } catch (err) {
    console.error('failed to open file:', err);
    return false;
  }
})

const createWindow = () => {
  const win = new BrowserWindow({
    backgroundColor: '#1d2021',
    icon: nativeImage.createFromPath(path.join(__dirname, '../build/images/icon48.png')),
    autoHideMenuBar : true,
    width: 1280,
    height: 720,
    webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        devTools: true,
    },
    show: false,
  })

  win.webContents.on('did-frame-finish-load', () => {
    if (process.env.NODE_ENV === 'development') {
      win.webContents.openDevTools({ mode: 'detach' });
    }
    win.show();
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  return win;
}

// Auto-update setup function
function setupAutoUpdater(mainWindow) {
  if (!autoUpdater) return;

  // Log events for debugging
  autoUpdater.logger = console;
  autoUpdater.logger.transports.file.level = 'info';

  // Check for updates
  autoUpdater.checkForUpdatesAndNotify().catch(err => {
    console.log('Error checking for updates:', err);
  });

  // Event: Update available
  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info);
    mainWindow.webContents.send('update-available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes
    });
  });

  // Event: Update not available
  autoUpdater.on('update-not-available', () => {
    console.log('Update not available');
    mainWindow.webContents.send('update-not-available');
  });

  // Event: Download progress
  autoUpdater.on('download-progress', (progressObj) => {
    const logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
    console.log(logMessage);
    mainWindow.webContents.send('download-progress', progressObj);
  });

  // Event: Update downloaded
  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded');
    mainWindow.webContents.send('update-downloaded', {
      version: info.version,
      releaseDate: info.releaseDate
    });
    
    // Optional: Show dialog asking user to restart now
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: `A new version (${info.version}) has been downloaded.`,
      detail: 'The update will be installed when you restart the application. Would you like to restart now?',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall(false, true);
      }
    });
  });

  // Event: Error
  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err);
  });

  // IPC handlers for manual update check
  ipcMain.on('check-for-updates', () => {
    autoUpdater.checkForUpdates().catch(err => {
      console.log('Manual update check error:', err);
    });
  });

  ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall(false, true);
  });
}

app.whenReady().then(() => {
  const mainWindow = createWindow();

  // Setup auto-updater after window is created
  if (process.env.NODE_ENV !== 'development') {
    setupAutoUpdater(mainWindow);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
