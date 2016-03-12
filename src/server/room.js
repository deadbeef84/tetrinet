import EventEmitter from 'events'
import Player from './player'
import Bot from '../common/bot'
import Board from '../common/board'

export default class Room extends EventEmitter {

  static STOPPED = 0;
  static STARTING = 1;
  static STARTED = 2;

  players = {};

  constructor (cursor, options) {
    super()
    this.cursor = cursor
    this.cursor.set({
      ...options,
      players: {},
      state: Room.STOPPED
    })
    this.cursor.on('update', (x) => {
      const {
        state,
        players
      } = x.data.currentData
      if (state === Room.STOPPED) {
        if (Object.values(players).every(({ready}) => ready)) {
          this.cursor.merge({state: Room.STARTED})
        }
      }
    })
  }

  join (socket, options) {
    const id = socket.client.id
    const cursor = this.cursor.select(['players', id])
    this.players[id] = new Player(socket, cursor, options, this)
    socket.on('disconnect', (x) => {
      cursor.unset()
      delete this.players[id]
    })
    return this.players[id]
  }

  addBot () {
    const id = `Bot ${Math.floor(Math.random() * 1000000)}`
    const cursor = this.cursor.select(['players', id])
    this.players[id] = new Player(null, cursor, {name: id}, this)
    const bot = new Bot()
    bot.setOptions({height: 24, width: 12, specials: false, generator: 1, entrydelay: 0, rotationsystem: 1, tspin: true, holdpiece: true, nextpiece: 3})
    bot.start()
    bot.on(Board.EVENT_CHANGE, () => cursor.set('data', bot.data))
    bot.on(Board.EVENT_UPDATE, () => cursor.set('block', bot.currentBlock))
    return this.players[id]
  }
}
