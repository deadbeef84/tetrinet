import client from './client'

export function selectRoom (id) {
  return new Promise((resolve) => {
    client.emit('join', id, resolve)
  })
}

export function sendBoard (data) {
  client.emit('update', {data})
}
