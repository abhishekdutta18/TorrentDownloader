import WebTorrent from 'webtorrent'
const client = new WebTorrent()
const torrentId = 'magnet:?xt=urn:btih:ed8507e22addc40fd6fb4f1677bf27fd75967f70&dn=archlinux-2026.08.01-x86_64.iso&tr=udp%3A%2F%2Ftracker.archlinux.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Fopen.demonii.com%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337'
const t = client.add(torrentId)
console.log("Returned:", t)
