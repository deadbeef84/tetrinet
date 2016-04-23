import Client from 'socket.io-client'
import tree from './state'

const socket = new Client({reconnection: false})

socket.on('connect', () => {
  console.log('connected')
})

socket.on('disconnect', () => {
  console.log('disconnect')
  setTimeout(() => document.location.reload(true), 2000)
})

socket.on('init', (state) => {
  tree.set(state)
})

socket.on('update', (transactions) => {
  transactions
    .map(({type, value, path}) => type === 'push'
      ? {type, value, path: path.slice(0, -1)}
      : {type, value, path})
    .forEach(({type, value, path}) => tree.update(path, {type, value}))
})

export default socket
