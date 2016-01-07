import EventEmitter from 'events'
import Player from './player'

export default class Room extends EventEmitter {
  static STOPPED = 0;
  static STARTING = 1;
  static STARTED = 2;

  players = {};

  constructor(cursor, options) {
    super()
    this.cursor = cursor
    this.cursor.set({
      ...options,
      players: {},
      state: Room.STOPPED,
    })
    this.cursor.on('update', x => {
      const {
        state,
        players,
      } = x.data.currentData
      if (state === Room.STOPPED) {
        if (Object.values(players).every(({ready}) => ready)) {
          this.cursor.merge({state: Room.STARTED})
        }
      }
    })
  }

  join(socket, options) {
    const cursor = this.cursor.select(['players', socket.id])
    this.players[socket.id] = new Player(socket, cursor, options, this)
    socket.on('disconnect', x => {
      cursor.unset()
      delete this.players[socket.id]
    })
    return this.players[socket.id]
  }
}
