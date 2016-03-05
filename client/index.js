import Client from 'socket.io-client'
import Baobab from 'baobab'
import Player from './player'
import PlayerView from './playerview'
import './css/style.css'

const socket = new Client({reconnection: false})
socket.on('connect', () => {
  console.log('connected')
})
socket.on('init', state => {
  console.log(state)
  const tree = new Baobab(state)
  socket.on('update', transactions => {
    // console.log(transactions)
    transactions
      .map(({type, value, path}) => type === 'push'
        ? {type, value, path: path.slice(0, -1)}
        : {type, value, path})
      .forEach(({type, value, path}) => tree.update(path, {type, value}))
  })
  const main = document.getElementById('main')
  const view = document.createElement('div')
  main.parentNode.appendChild(view)

  const player = new Player()
  player.setOptions({height:24, width:12, specials: false, generator: 1, entrydelay: 0, rotationsystem: 1, tspin: true, holdpiece: true, nextpiece: 3})
  const playerView = new PlayerView(player)
  view.appendChild(playerView.el[0])
  playerView.el.addClass('self')

  document.addEventListener('keydown', ({key}) => {
    switch (key) {
      case 'Left':
        player.move(-1, 0, 0, false)
        break
      case 'Right':
        player.move(1, 0, 0, false)
        break
      case 'Up':
        player.move(0, 0, 1, false)
        break
      case 'Down':
        player.move(0, 1, 0, false)
        break
      case ' ':
        player.falldown(true)
        break
      default:
        console.log(key)
    }
  })
  player.start()

  // tree.select('time').on('update', ({target}) => main.textContent = target.get())
  tree.on('update', x => main.textContent = JSON.stringify(x.data.currentData))

  socket.on('self', path => {
    console.log(path)
    setTimeout(() => socket.emit('update', {ready: true}), 2000)
  })
})
