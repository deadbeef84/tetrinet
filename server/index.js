import optimist from 'optimist'
import express from 'express'
import {createServer} from 'http'
import socketio from 'socket.io'
import Game from './game'

const app = express()
const server = createServer(app)
const io = socketio(server)
// const game = new Game(io)

const argv = optimist
  .usage('Usage: $0 --port [num]')
  .default({port: 1080})
  .argv

app.use(express.static(__dirname + '/../build'))

import Baobab from 'baobab'
const tree = new Baobab({
  time: Date.now(),
  rooms: {},
  players: {},
})

tree.on('update', ({data}) => {
  console.dir(data, {depth:5})
  io.emit('update', data.transaction)
})
// tree.set(['players', 'test'], {name: 'Jesper'})
// tree.set(['players', 'test2'], {name: 'Jesper'})
// tree.set(['players', 'test'], {name: 'Jesper Ek'})

io.on('connection', socket => {
  console.log('Client connected!')
  socket.emit('init', tree.get())
})

setInterval(() => tree.set('time', Date.now()), 1000)

server.listen(argv.port, () => {
  console.log('Server listening at port %d', argv.port)
})
