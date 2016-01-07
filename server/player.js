import EventEmitter from 'events'

export default class Player extends EventEmitter {
  static IDLE = 0;
  static PLAYING = 1;
  static DEAD = 2;
  static WINNER = 3;

  constructor(socket, cursor, options, room) {
    super()
    this.cursor = cursor
    this.room = room

    this.cursor.set({
      ...options,
      state: Player.IDLE,
      ready: false,
      data: "foo",
    })

    socket.on('update', data => {
      this.cursor.merge(data)
    })
  }
}
