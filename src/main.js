const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

// Required on Linux for speechSynthesis / TTS to work
app.commandLine.appendSwitch('enable-speech-dispatcher');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

const { ipcMain } = require('electron');

const sendAction = (action) => {
  if (mainWindow) mainWindow.webContents.send('menu-action', action);
};

const buildMenu = () => {
  const isMac = process.platform === 'darwin';

  const template = [
    // macOS app menu
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    }] : []),

    // Navigate
    {
      label: 'Navigate',
      submenu: [
        {
          label: 'Reader',
          accelerator: 'CmdOrCtrl+1',
          click: () => sendAction('open-reader'),
        },
        {
          label: 'Home / Dashboard',
          accelerator: 'CmdOrCtrl+2',
          click: () => sendAction('open-dashboard'),
        },
        { type: 'separator' },
        {
          label: 'Library',
          accelerator: 'CmdOrCtrl+L',
          click: () => sendAction('open-library'),
        },
        {
          label: 'Reading Plans',
          accelerator: 'CmdOrCtrl+R',
          click: () => sendAction('open-plans'),
        },
        {
          label: 'Prayer Journal',
          accelerator: 'CmdOrCtrl+P',
          click: () => sendAction('open-prayer'),
        },
        {
          label: 'Search',
          accelerator: 'CmdOrCtrl+F',
          click: () => sendAction('open-search'),
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => sendAction('open-settings'),
        },
      ],
    },

    // Scripture
    {
      label: 'Scripture',
      submenu: [
        {
          label: 'Previous Chapter',
          accelerator: 'CmdOrCtrl+Left',
          click: () => sendAction('prev-chapter'),
        },
        {
          label: 'Next Chapter',
          accelerator: 'CmdOrCtrl+Right',
          click: () => sendAction('next-chapter'),
        },
        { type: 'separator' },
        {
          label: 'Toggle Split View',
          accelerator: 'CmdOrCtrl+\\',
          click: () => sendAction('toggle-split'),
        },
        {
          label: 'Read Aloud',
          accelerator: 'CmdOrCtrl+Space',
          click: () => sendAction('toggle-tts'),
        },
        { type: 'separator' },
        {
          label: 'Open Passage Picker',
          accelerator: 'CmdOrCtrl+G',
          click: () => sendAction('open-picker'),
        },
      ],
    },

    // Edit
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },

    // View
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        ...(!app.isPackaged ? [{ role: 'toggleDevTools' }] : []),
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },

    // Window
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
        ] : [
          { role: 'close' },
        ]),
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
};

const createWindow = () => {
  const statePath = path.join(app.getPath('userData'), 'window-state.json');
  let windowState = { width: 1024, height: 768, isMaximized: false };

  try {
    if (fs.existsSync(statePath)) {
      windowState = Object.assign(windowState, JSON.parse(fs.readFileSync(statePath, 'utf8')));
    }
  } catch (e) {
    console.error('Failed to load window state', e);
  }

  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    frame: false,
    backgroundColor: '#0a0a0b', // matches --bg-deep; prevents white 1px OS border on Linux
    icon: path.join(__dirname, 'assets', 'logo.png'),
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      spellcheck: false,
      contextIsolation: true,
      nodeIntegration: false
    },
  });

  if (windowState.isMaximized) {
    mainWindow.maximize();
  }

  const saveState = () => {
    if (!mainWindow) return;
    try {
      const isMaximized = mainWindow.isMaximized();
      if (!isMaximized) {
        Object.assign(windowState, mainWindow.getBounds());
      }
      windowState.isMaximized = isMaximized;
      fs.writeFileSync(statePath, JSON.stringify(windowState));
    } catch (e) {
      console.error('Failed to save window state', e);
    }
  };

  let stateTimeout;
  const debouncedSaveState = () => {
    clearTimeout(stateTimeout);
    stateTimeout = setTimeout(saveState, 500);
  };

  mainWindow.on('resize', debouncedSaveState);
  mainWindow.on('move', debouncedSaveState);
  mainWindow.on('close', saveState);

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  // Remove default menu
  Menu.setApplicationMenu(null);

  // Prevent unintended navigations (e.g. from links that escape interception)
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow.webContents.getURL()) {
      event.preventDefault();
      // Optionally open external http links in the system browser
      if (url.startsWith('http')) {
        shell.openExternal(url);
      }
    }
  });

  // Handle target="_blank" links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Window control IPCs
  ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });
  
  ipcMain.on('window-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });
  
  ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.close();
  });
};

app.whenReady().then(() => {
  createWindow();

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
