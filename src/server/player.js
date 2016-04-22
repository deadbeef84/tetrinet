import EventEmitter from 'events'

export default class Player extends EventEmitter {
  static IDLE = 0;
  static READY = 1;
  static PLAYING = 2;

  constructor (socket, cursor, options, room) {
    super()
    this.socket = socket
    this.cursor = cursor
    this.room = room

    this.cursor.set({
      ...options,
      state: Player.IDLE,
      data: ''
    })

    socket && socket.on('update', (data) => {
      this.cursor.merge(data)
    })
  }
}
