import React, {Component} from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'baobab-react/prop-types'
import {branch} from 'baobab-react/higher-order'
import Player from '../../common/player'
// import Special from '../../common/special'
import Board from '../../common/board'
import Block from '../../common/block'
import PlayerView from '../playerview'
import client from '../client'
import {sendBoard, sendBlock, gameover, sendSpecial, on, ready} from '../actions'

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
      ready()
    }
  })

  console.log(room.get('rules'))

  const onKeydownListener = this::onKeydown
  document.addEventListener('keydown', onKeydownListener)
  player.on(Player.EVENT_GAMEOVER, () => gameover())
  player.on(Board.EVENT_CHANGE, () => sendBoard(player.data))
  player.on(Board.EVENT_UPDATE, () => sendBlock(player.currentBlock))

  const onUpdate = (e) => {
    const prev = e.data.previousData
    const {index, name, state} = e.data.currentData
    const stateString = state === 0
      ? 'IDLE'
      : (state === 1 ? 'READY' : 'PLAYING')
    playerView.setName(`${index || '?'}. ${name} [${stateString}]`)
    if (state !== prev.state) {
      if (state === 2 && !player.isPlaying) {
        console.log('starting!')
        player.start(0, room.get('rules'))
      } else if (state !== 2 && player.isPlaying) {
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

  on('special', (data) => {
    player.use(data)
  })

  player.dispose = () => {
    document.removeEventListener('keydown', onKeydownListener)
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

function onKeydown ({key, code, keyCode}) {
  if (!this.self) {
    return
  }
  switch (key || code || keyCode) {
    case 'Left':
    case 'ArrowLeft':
      this.self.move(-1, 0, 0, false)
      break
    case 'Right':
    case 'ArrowRight':
      this.self.move(1, 0, 0, false)
      break
    case 'Up':
    case 'ArrowUp':
      this.self.move(0, 0, 1, false)
      break
    case 'Down':
    case 'ArrowDown':
      this.self.move(0, 1, 0, false)
      break
    case ' ':
    case 'Space':
      this.self.falldown(true)
      break
    case 'Digit0':
    case 'Digit1':
    case 'Digit2':
    case 'Digit3':
    case 'Digit4':
    case 'Digit5':
    case 'Digit6':
    case 'Digit7':
    case 'Digit8':
    case 'Digit9':
      const idx = parseInt(code.slice(5), 10)
      this::useSpecial(idx)
      break

    default:
      console.log(key, code, keyCode)
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
      sendSpecial(msg)
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
