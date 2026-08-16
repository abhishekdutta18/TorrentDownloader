const { ipcRenderer } = require('electron')
ipcRenderer.invoke('add-torrent', 'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel').then(console.log).catch(console.error)
