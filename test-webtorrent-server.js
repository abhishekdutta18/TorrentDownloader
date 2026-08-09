import('webtorrent').then(async w => {
  const client = new w.default()
  const magnet = 'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent'
  const torrent = client.add(magnet)
  
  torrent.on('ready', () => {
    const server = client.createServer()
    server.listen(0, async () => {
      const port = server.address().port
      const torrentIndex = client.torrents.indexOf(torrent)
      
      console.log('Fetching /webtorrent/' + torrent.infoHash + '/0')
      try {
        const res = await fetch(`http://localhost:${port}/webtorrent/${torrent.infoHash}/0`)
        console.log('res1:', res.status)
      } catch (e) { console.log(e) }
      
      console.log('Fetching /webtorrent/' + torrentIndex + '/0')
      try {
        const res = await fetch(`http://localhost:${port}/webtorrent/${torrentIndex}/0`)
        console.log('res2:', res.status)
      } catch (e) { console.log(e) }
      
      process.exit(0)
    })
  })
})
