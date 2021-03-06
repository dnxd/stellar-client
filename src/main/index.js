import {
  app,
  BrowserWindow,
  screen
} from 'electron'

const setupContextMenu = require('electron-context-menu')
const Settings = require('./settings')

const isDevelopment = process.env.NODE_ENV !== 'production'

class MainApp {
  constructor() {
    this.defaultHeight = 750
    this.defaultWidth = 700

    this.setupSettings()
    setupContextMenu({})

    this.mainWindow = this.createMainWindow()

    // Quit application when all windows are closed
    app.on('window-all-closed', () => {
      // On macOS it is common for applications to stay open
      // until the user explicitly quits
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })

    app.on('activate', () => {
      // On macOS it is common to re-create a window
      // even after all windows have been closed
      if (this.mainWindow === null) {
        this.mainWindow = this.createMainWindow()
      }
    })
  }

  windowOnScreen(inX, inY) {
    let result = false

    const displays = screen.getAllDisplays()
    displays.forEach(function(display) {
      const x = display.bounds.x
      let mx = display.bounds.x + display.bounds.width
      const y = display.bounds.y
      let my = display.bounds.y + display.bounds.height

      // some buffer so it's not on the edge
      mx += 30
      my -= 30

      if (inX >= x && inX < mx) {
        if (inY >= y && inY < my) {
          result = true
        }
      }
    })

    return result
  }

  createMainWindow() {
    const width = this.settings.get(this.prefKey('win_width'))
    const height = this.settings.get(this.prefKey('win_height'))
    let x = this.settings.get(this.prefKey('win_x'))
    let y = this.settings.get(this.prefKey('win_y'))

    if (!this.windowOnScreen(x, y)) {
      x = null
      y = null // centers
    }

    // Construct new BrowserWindow
    const window = new BrowserWindow({
      x: x,
      y: y,
      show: true,
      width: width,
      height: height,
      frame: true,
      title: 'Stellar Client',
      transparent: false,
      resizable: true,
      webPreferences: {
        overlayScrollbars: true,
        overlayFullscreenVideo: true
      }
    })

    // no ugly menus on this window, hit alt to toggle
    window.setAutoHideMenuBar(true)
    window.setMenuBarVisibility(false)

    // Set url for `win`
    // points to `webpack-dev-server` in development
    // points to `index.html` in production
    const url = isDevelopment ? `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}` : `file://${__dirname}/index.html`

    // if (isDevelopment) {
    //   window.webContents.openDevTools()
    // }

    // prevent window name changes
    window.on('page-title-updated', (event) => {
      event.preventDefault()
    })

    window.on('resize', () => {
      this.settings.set(this.prefKey('win_width'), window.getSize()[0])
      this.settings.set(this.prefKey('win_height'), window.getSize()[1])
    })

    window.on('move', () => {
      this.settings.set(this.prefKey('win_x'), window.getBounds().x)
      this.settings.set(this.prefKey('win_y'), window.getBounds().y)
    })

    window.loadURL(url)

    window.on('closed', () => {
      this.mainWindow = null
    })

    window.webContents.on('devtools-opened', () => {
      window.focus()
      setImmediate(() => {
        window.focus()
      })
    })

    return window
  }

  prefKey(key) {
    return 'sc_' + key
  }

  setupSettings() {
    this.settings = new Settings('stellar-settings')
    if (!this.settings.get(this.prefKey('win_width'))) {
      this.settings.set(this.prefKey('win_width'), this.defaultWidth)
    }
    if (!this.settings.get(this.prefKey('win_height'))) {
      this.settings.set(this.prefKey('win_height'), this.defaultHeight)
    }
  }
}

app.on('ready', function() {
  new MainApp()
})
