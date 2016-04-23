import React, {Component} from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'baobab-react/prop-types'
import {branch} from 'baobab-react/higher-order'
import Player from '../../common/player'
import Board from '../../common/board'
import Block from '../../common/block'
import PlayerView from '../playerview'
import client from '../client'
import * as actions from '../actions'
import input from '../input'
import { get as getSetting } from './settings'

class Game extends Component {
  static contextTypes = {
    cursors: PropTypes.cursors
  }

  self = null
  players = {}

  componentDidMount () {
    this.componentWillReceiveProps(this.props)
  }

  componentWillReceiveProps ({room, roomPath}) {
    const dom = ReactDOM.findDOMNode(this)
    const roomCursor = this.context.cursors.room

    Object.keys(room.players)
      .filter(id => !(id in this.players))
      .map((id) => {
        const isSelf = client.id === id
        console.log(`Adding player ${id} ${isSelf}`)
        this.players[id] = isSelf
          ? this::createPlayer(id, dom, roomCursor.select('players', id), roomCursor)
          : this::createOpponent(id, dom, roomCursor.select('players', id), roomCursor)
        if (isSelf) {
          this.self = this.players[id]
        }
      })

    Object.keys(this.players)
      .filter(id => !(id in room.players))
      .map((id) => {
        console.log(`Removing player ${id}`)
        this.players[id].dispose()
        delete this.players[id]
      })
  }

  shouldComponentUpdate () {
    return false
  }

  render () {
    return <div/>
  }
}

function createPlayer (id, dom, cursor, room) {
  const player = new Player()
  const playerView = new PlayerView(player)
  playerView.el.addClass('self')
  const el = playerView.el[0]
  dom.appendChild(el)

  el.addEventListener('click', () => {
    console.log('click')
    if (cursor.get('state') === 0) {
      actions.ready()
    }
  })

  const onKeydownListener = this::onKeydown
  input.on('input', onKeydownListener)
  player.on(Player.EVENT_GAMEOVER, () => actions.gameover())
  player.on(Board.EVENT_CHANGE, () => actions.sendBoard(player.data))
  player.on(Board.EVENT_UPDATE, () => actions.sendBlock(player.currentBlock))
  player.on(Board.EVENT_LINES, (lines) => {
    let linesToAdd = lines === 4 ? 4 : lines - 1
    // t-spin
    if (player.lastDropTspin) {
      linesToAdd = lines * 2
    }
    if (linesToAdd > 0 && player.backToBack) {
      ++linesToAdd
    }
    if (linesToAdd > 0) {
      actions.sendLines(linesToAdd)
    }
    // check board clear?
    player.lastDropTspin && console.log('T-SPIN!')
    player.backToBack && console.log('BACK2BACK')
  })

  const onUpdate = (e) => {
    const prev = e.data.previousData
    const {index, name, state} = e.data.currentData
    const stateString = state === 0
      ? 'IDLE'
      : (state === 1 ? 'READY' : 'PLAYING')
    playerView.setName(`${index || '?'}. ${name} [${stateString}]`)
    if (state !== prev.state) {
      if (state === 2) {
        console.log('starting!')
        player.start(0, room.get('rules'))
      } else if (state !== 2) {
        console.log('stopping')
        player.stop()
      }
      el.classList.remove('gameover', 'winner')
      if (state !== 2) {
        el.classList.add(room.get('winners').includes(id) ? 'winner' : 'gameover')
      }
    }
  }
  onUpdate({data: {previousData: {}, currentData: cursor.get()}})
  cursor.on('update', onUpdate)

  // TODO unregister this event-handler
  actions.on('special', (data) => {
    player.use(data)
  })

  actions.on('lines', (lines) => {
    player.addLines(lines)
  })

  player.dispose = () => {
    input.removeEventListener('input', onKeydownListener)
    player.removeAllListeners()
    cursor.off(onUpdate)
    dom.removeChild(el)
  }

  return player
}

function createOpponent (id, dom, cursor, room) {
  const player = new Board()
  const playerView = new PlayerView(player)
  const el = playerView.el[0]
  dom.appendChild(el)

  const onUpdate = (e) => {
    const prev = e.data.previousData
    const {index, state, name, data, block} = e.data.currentData
    const stateString = state === 0
      ? 'IDLE'
      : (state === 1 ? 'READY' : 'PLAYING')
    playerView.setName(`${index || '?'}. ${name} [${stateString}]`)
    if (data !== prev.data) {
      player.data = data
    }
    if (block !== prev.block) {
      player.currentBlock = block ? new Block(block) : null
    }
    if (state !== prev.state) {
      el.classList.remove('gameover', 'winner')
      if (state !== 2) {
        el.classList.add(room.get('winners').includes(id) ? 'winner' : 'gameover')
      }
    }
    player.emit(Board.EVENT_UPDATE)
  }
  onUpdate({data: {previousData: {}, currentData: cursor.get()}})
  cursor.on('update', onUpdate)

  player.dispose = () => {
    dom.removeChild(el)
    cursor.off(onUpdate)
  }

  return player
}

function onKeydown (e) {
  const key = e.which
  if (!this.self) {
    return
  }
  input.delay = getSetting('inputDelay')
  input.interval = getSetting('inputInterval')
  const actions = {
    keyLeft: () => this.self.move(-1, 0, 0, false),
    keyRight: () => this.self.move(1, 0, 0, false),
    keyRotateCw: () => this.self.move(0, 0, 1, false),
    keyRotateCcw: () => this.self.move(0, 0, -1, false),
    keyDown: () => this.self.move(0, 1, 0, false),
    keyDrop: () => this.self.falldown(true),
    keySoftDrop: () => this.self.falldown(false),
    keyHold: () => this.self.hold(),
    keyInventory1: () => this::useSpecial(1),
    keyInventory2: () => this::useSpecial(2),
    keyInventory3: () => this::useSpecial(3),
    keyInventory4: () => this::useSpecial(4),
    keyInventory5: () => this::useSpecial(5),
    keyInventory6: () => this::useSpecial(6),
    keyInventory7: () => this::useSpecial(7),
    keyInventory8: () => this::useSpecial(8),
    keyInventory9: () => this::useSpecial(9)
  }
  const actionKey = Object.keys(actions)
    .find(k => getSetting(k) === key)
  if (actionKey) {
    actions[actionKey]()
    e.preventDefault()
  } else {
    console.log(key)
  }
}

function useSpecial (idx) {
  const { room } = this.props
  const inventory = this.self.inventory
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
      this.self.emit(Player.EVENT_INVENTORY)
    }
  }
}

export default branch(Game, {
  cursors: (props) => ({
    room: props.roomPath
  })
})
