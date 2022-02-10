console.log('I am the app now!');

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
    'electron',
    {
        goBack: () => ipcRenderer.send('goBack'),
        goForward: () => ipcRenderer.send('goForward'),
        subscribeOnpageChange: (callback) => ipcRenderer.on('changed-navigation-options', (event, canGoBack, canGoForward) => { callback(canGoBack, canGoForward) })
    }
)