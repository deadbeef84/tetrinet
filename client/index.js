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
    console.log(transactions)
    transactions
      .map(({type, value, path}) => type === 'push'
        ? {type, value, path: path.slice(0, -1)}
        : {type, value, path})
      .forEach(({type, value, path}) => tree.update(path, {type, value}))
  })
  const main = document.getElementById('main')
  // tree.select('time').on('update', ({target}) => main.textContent = target.get())
  tree.on('update', x => main.textContent = JSON.stringify(x.data.currentData))

  socket.on('self', path => {
    console.log(path)
    setTimeout(() => socket.emit('update', {ready: true}), 2000)
  })
})
