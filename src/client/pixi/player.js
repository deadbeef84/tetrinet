import TetrisPlayer from '../../common/player'
import Board from '../../common/board'
import Block from '../../common/block'
import client from '../client'
import * as actions from '../actions'
import input from '../input'
import { get as getSetting } from '../components/settings'
import { Graphics } from 'pixi.js'

export default class Player extends Graphics {
  disposers = []

  constructor (id, cursor, room) {
    super()

    this.id = id
    this.cursor = cursor
    this.room = room

    if (id === client.id) {
      const player = this.player = new TetrisPlayer()

      player.on(Player.EVENT_GAMEOVER, () => actions.gameover())
      player.on(Board.EVENT_CHANGE, () => actions.sendBoard(player.data))
      player.on(Board.EVENT_UPDATE, () => {
        actions.sendBlock(player.currentBlock)
        this.render()
      })
      player.on(Board.EVENT_LINES, (e) => this.onLines(e))
      this.disposers.push(() => player.removeAllListeners())

      // TODO remove event listeners
      actions.on('special', (data) => player.use(data))
      actions.on('lines', (lines) => player.addLines(lines))

      const onKeydown = ::this.onKeydown
      input.on('input', onKeydown)
      this.disposers.push(() => input.removeEventListener('input', onKeydown))

      const onUpdate = ::this.onUpdate
      cursor.on('update', onUpdate)
      this.disposers.push(() => cursor.off('update', onUpdate))
      this.onUpdate({data: {previousData: {}, currentData: cursor.get()}})

      setTimeout(() => actions.ready(), 2000)
    } else {
      this.player = new Board()

      this.player.on(Board.EVENT_UPDATE, () => this.render())

      const onUpdateOpponent = ::this.onUpdateOpponent
      cursor.on('update', onUpdateOpponent)
      this.disposers.push(() => cursor.off('update', onUpdateOpponent))
      this.onUpdateOpponent({data: {previousData: {}, currentData: cursor.get()}})
    }

    this.render()
  }

  render () {
    this.clear()

    const isSelf = this.id === client.id

    // update ghost block
    if (isSelf) {
      this.player.updateGhostBlock()
    }

    // update board
    const colors = {
      1: 0xFF3300,
      2: 0x00FF00,
      3: 0x0000FF,
      4: 0x00FFFF,
      5: 0xFF00FF,
      6: 0x00FF00,
      10: 0x333333
    }
    const size = 20
    const width = size * (this.player.width + 1)

    this.position.x = width * this.cursor.get('index')
    for (let y = Board.VANISH_ZONE_HEIGHT; y < this.player.height; ++y) {
      for (let x = 0; x < this.player.width; ++x) {
        const b = this.player.at(x, y)
        this.beginFill(colors[b] || (b ? 0xFF3300 : 0))
        this.drawRect(x * size, y * size, size, size)
        this.endFill()
      }
    }
  }

  onLines (lines) {
    let linesToAdd = lines === 4 ? 4 : lines - 1
    // t-spin
    if (this.player.lastDropTspin) {
      linesToAdd = lines * 2
    }
    if (linesToAdd > 0 && this.player.backToBack) {
      ++linesToAdd
    }
    if (linesToAdd > 0) {
      actions.sendLines(linesToAdd)
    }
    // check board clear?
    this.player.lastDropTspin && console.log('T-SPIN!')
    this.player.backToBack && console.log('BACK2BACK')
  }

  onUpdate (e) {
    const prev = e.data.previousData
    const {index, name, state} = e.data.currentData
    const stateString = state === 0
      ? 'IDLE'
      : (state === 1 ? 'READY' : 'PLAYING')
    // playerView.setName(`${index || '?'}. ${name} [${stateString}]`)
    if (state !== prev.state && this.player.start) {
      if (state === 2) {
        console.log('starting')
        this.player.start(0, this.room.get('rules'))
      } else if (state !== 2) {
        this.player.stop()
      }
    }
  }

  onUpdateOpponent (e) {
    const prev = e.data.previousData
    const {index, name, state, data, block} = e.data.currentData
    if (data !== prev.data) {
      this.player.data = data
    }
    if (block !== prev.block) {
      this.player.currentBlock = block ? new Block(block) : null
    }
    this.player.emit(Board.EVENT_UPDATE)
  }

  dispose () {
    this.disposers.forEach(d => d())
    this.disposers.length = 0
  }

  onKeydown (e) {
    const key = e.which
    if (!this.player) {
      return
    }
    input.delay = getSetting('inputDelay')
    input.interval = getSetting('inputInterval')
    const actions = {
      keyLeft: () => this.player.move(-1, 0, 0, false),
      keyRight: () => this.player.move(1, 0, 0, false),
      keyRotateCw: () => this.player.move(0, 0, 1, false),
      keyRotateCcw: () => this.player.move(0, 0, -1, false),
      keyDown: () => this.player.move(0, 1, 0, false),
      keyDrop: () => this.player.falldown(true),
      keySoftDrop: () => this.player.falldown(false),
      keyHold: () => this.player.hold(),
      keyInventory1: () => this.useSpecial(1),
      keyInventory2: () => this.useSpecial(2),
      keyInventory3: () => this.useSpecial(3),
      keyInventory4: () => this.useSpecial(4),
      keyInventory5: () => this.useSpecial(5),
      keyInventory6: () => this.useSpecial(6),
      keyInventory7: () => this.useSpecial(7),
      keyInventory8: () => this.useSpecial(8),
      keyInventory9: () => this.useSpecial(9)
    }
    const actionKey = Object.keys(actions)
      .find(k => getSetting(k) === key)
    if (actionKey) {
      actions[actionKey]()
      e.preventDefault()
    } else {
      // console.log(key)
    }
  }

  useSpecial (idx) {
    const { room } = this.props
    const inventory = this.player.inventory
    if (inventory && inventory.length) {
      const targetId = Object.keys(room.players)
        .find((id) => {
          const player = room.players[id]
          return player.index === idx && player.state === 2
        })
      if (targetId) {
        const target = this.players[targetId]
        const s = inventory.shift()
        const msg = {s, id: targetId}
        actions.sendSpecial(msg)
        if (target instanceof Player) {
          target.use(msg)
        } else {
          target.emit(Player.EVENT_SPECIAL, msg)
        }
        this.player.emit(Player.EVENT_INVENTORY)
      }
    }
  }
}
