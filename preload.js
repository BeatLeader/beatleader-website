console.log('I am the app now!');

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
    'electron',
    {
        goBack: () => ipcRenderer.send('goBack'),
        goForward: () => ipcRenderer.send('goForward')
    }
)