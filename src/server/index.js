import path from 'path'
import express from 'express'
import { createServer } from 'http'
import socketio from 'socket.io'
import Room from './room'
import Baobab from 'baobab'

const app = express()
const server = createServer(app)
const io = socketio(server)

app.use(express.static(path.join(__dirname, '..', '..', 'build')))

const tree = new Baobab({
  time: Date.now(),
  rooms: {}
})

const rooms = {}
let roomId = 0
function addRoom (options, rules) {
  const id = ++roomId
  const cursor = tree.select(['rooms', id])
  rooms[id] = new Room(cursor, options, rules)
  return rooms[id]
}

const room = addRoom({ name: 'Testing' }, { specials: true })
room.addBot({delay: 25})
room.addBot({delay: 200})

tree.on('update', ({data}) => {
  // console.dir(data, {depth:5})
  io.emit('update', data.transaction)
})

io.on('connection', (socket) => {
  console.log('Client connected!')
  socket.emit('init', tree.get())
  socket.on('join', (id, respond) => {
    const room = rooms[id]
    const player = room.join(socket, {name: 'Jesper'})
    respond({
      id,
      room: room.cursor.path,
      player: player.cursor.path
    })
  })
})

setInterval(() => tree.set('time', Date.now()), 1000)

const port = process.env.PORT || 1080
server.listen(port, () => {
  console.log('Server listening at port', port)
})
