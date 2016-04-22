import EventEmitter from 'events'

export default class Player extends EventEmitter {
  static IDLE = 0;
  static READY = 1;
  static PLAYING = 2;

  constructor (socket, cursor, options, room) {
    super()
    this.cursor = cursor
    this.room = room

    this.cursor.set({
      ...options,
      state: Player.READY,
      data: ''
    })

    socket && socket.on('update', (data) => {
      this.cursor.merge(data)
    })
  }
}
