import client from './client'

export function selectRoom (id) {
  return new Promise((resolve) => {
    client.emit('join', id, resolve)
  })
}

export function ready () {
  client.emit('update', {state: 1})
}

export function sendBoard (data) {
  client.emit('update', {data})
}

export function sendBlock (block) {
  client.emit('update', {block})
}

export function gameover () {
  client.emit('update', {state: 0})
}

export function sendSpecial (data) {
  client.emit('special', data)
}

export function sendLines (lines) {
  client.emit('lines', lines)
}

export function on (type, cb) {
  client.on(type, cb)
}
