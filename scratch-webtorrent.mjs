import WebTorrent from 'webtorrent'
const client = new WebTorrent()
const magnet = 'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com'
console.log('Adding torrent...')
const t = client.add(magnet, { path: '/tmp' })
t.on('ready', () => console.log('Ready!'))
t.on('download', (bytes) => console.log('Downloaded', bytes))
t.on('error', (err) => console.error('Error:', err))
setTimeout(() => {
  console.log('Peers:', t.numPeers, 'Progress:', t.progress)
  process.exit(0)
}, 5000)
