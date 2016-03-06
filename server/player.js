import EventEmitter from 'events'

export default class Player extends EventEmitter {
  constructor (socket, cursor, options, room) {
    super()
    this.cursor = cursor
    this.room = room

    this.cursor.set({
      ...options,
      state: Player.IDLE,
      ready: false,
      data: 'foo'
    })

    socket.on('update', (data) => {
      this.cursor.merge(data)
    })
  }
}
Player.IDLE = 0
Player.PLAYING = 1
Player.DEAD = 2
Player.WINNER = 3
