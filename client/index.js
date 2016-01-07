import Client from 'socket.io-client'
import Baobab from 'baobab'

const socket = new Client({reconnection: false})
socket.on('connect', () => {
  console.log('connected')
})
socket.on('init', state => {
  console.log(state)
  const tree = new Baobab(state)
  socket.on('update', transactions => {
    transactions
      .forEach(({type, value, path}) => tree.update(path, {type, value}))
  })
  const main = document.getElementById('main')
  tree.select('time').on('update', ({target}) => main.textContent = target.get())
  tree.on('update', x => console.log('!!!', x))
})
