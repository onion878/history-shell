// Modules to control application life and create native browser window
const {app, BrowserWindow, dialog} = require('electron');
const path = require('path');
app.showExitPrompt = true;
app.allowRendererProcessReuse = false;
const setting = require('./app/data/setting');

function createWindow() {
    // Create the browser window.
    let mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        frame: false,
        enableLargerThanScreen: true,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    setting.getWin().then(d => {
        if (d) {
            mainWindow.setSize(d.width, d.height);
            mainWindow.setPosition(d.x, d.y);
            if (d.maximal) {
                mainWindow.maximize();
            }
        }
        mainWindow.show();
    })

    // and load the index.html of the app.
    mainWindow.loadFile('index.html').then(r => {
        console.log('ui load success');
    });
    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
    mainWindow.on('close', function (e) {
        if (app.showExitPrompt) {
            e.preventDefault();
            dialog.showMessageBox(mainWindow, {
                type: 'question',
                buttons: ['否', '是'],
                title: '提示',
                defaultId: 1,
                message: '是否退出?',
                noLink: true
            }).then(({response}) => {
                if (response === 1) {
                    app.showExitPrompt = false;
                    let [x, y] = mainWindow.getPosition();
                    let [width, height] = mainWindow.getSize();
                    const maximal = mainWindow.isMaximized();
                    if (maximal) {
                        setting.setWin({
                            maximal: maximal
                        }).then(() => {
                            mainWindow.close();
                        });
                    } else {
                        setting.setWin({
                            x: x,
                            y: y,
                            width: width,
                            height: height,
                            maximal: maximal
                        }).then(() => {
                            mainWindow.close();
                        });
                    }
                }
            });
        }
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow()

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
