import WebTorrent from 'webtorrent'

async function test() {
  console.log('Testing without limit')
  const client = new WebTorrent()
  const magnetURI = 'magnet:?xt=urn:btih:ed8507e22addc40fd6fb4f1677bf27fd75967f70&dn=archlinux-2026.08.01-x86_64.iso&tr=udp%3A%2F%2Ftracker.archlinux.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce'
  
  const torrent = client.add(magnetURI, { path: './' })
  torrent.on('metadata', () => {
    console.log('Metadata fetched!')
  })
  torrent.on('download', (bytes) => {
    console.log('Downloaded', bytes)
  })
  torrent.on('error', (err) => {
    console.log('Error:', err)
  })

  setTimeout(() => {
    console.log('Timeout. Progress:', torrent.progress, 'Name:', torrent.name)
    client.destroy()
  }, 10000)
}

test()
