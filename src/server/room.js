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
      state: Room.STOPPED,
      winners: [],
    })
    this.cursor.on('update', (x) => {
      const {
        state,
        players
      } = x.data.currentData
      if (state === Room.STOPPED) {
        if (Object.values(players).every(({state}) => state === Player.READY) && Object.values(players).length >= 2) {
          this.cursor.deepMerge({
            state: Room.STARTED,
            players: Object.keys(players).reduce((acc, id) => ({
              ...acc,
              [id]: {state: Player.PLAYING}
            }), {})
          })
        }
      } else {
        const active = Object.keys(players)
          .map(id => ({ id, ...players[id] }))
          .filter(({state}) => state === Player.PLAYING)
        //console.log('Active', active)
        if (active.length === 1) {
          const winner = active[0]
          console.log(winner)
          this.cursor.deepMerge({
            state: Room.STOPPED,
            winners: [winner.id],
            players: {
              [winner.id]: { state: Player.IDLE }
            }
          })
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
    const state = cursor.select('state')
    state.set(Player.READY)
    state.on('update', ({data: { currentData }}) => {
      if (currentData === Player.IDLE) {
        bot.stop()
        console.log('bot ready')
        state.set(Player.READY)
      } else if (currentData === Player.PLAYING) {
        console.log('bot starting')
        bot.start()
      }
    })
    //cursor.set('data', bot.data.slice(0))
    bot.on(Board.EVENT_CHANGE, () => cursor.set('data', bot.data))
    bot.on(Board.EVENT_UPDATE, () => cursor.set('block', bot.currentBlock))
    return this.players[id]
  }
}
