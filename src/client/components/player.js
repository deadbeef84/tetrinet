import React, {Component} from 'react'
import ReactDOM from 'react-dom'
import {branch} from 'baobab-react/higher-order'
import TetrinetPlayer from '../../common/player'
import Board from '../../common/board'
import PlayerView from '../playerview'
import {sendBoard} from '../actions'

class Player extends Component {
  componentDidMount () {
    const dom = ReactDOM.findDOMNode(this)
    const {self} = this.props

    if (self) {
      const player = new TetrinetPlayer()
      player.setOptions({height: 24, width: 12, specials: false, generator: 1, entrydelay: 0, rotationsystem: 1, tspin: true, holdpiece: true, nextpiece: 3})

      const playerView = new PlayerView(player)
      playerView.el.addClass('self')
      dom.appendChild(playerView.el[0])

      document.addEventListener('keydown', ({key, code, keyCode}) => {
        switch (key || code || keyCode) {
          case 'Left':
          case 'ArrowLeft':
            player.move(-1, 0, 0, false)
            break
          case 'Right':
          case 'ArrowRight':
            player.move(1, 0, 0, false)
            break
          case 'Up':
          case 'ArrowUp':
            player.move(0, 0, 1, false)
            break
          case 'Down':
          case 'ArrowDown':
            player.move(0, 1, 0, false)
            break
          case ' ':
          case 'Space':
            player.falldown(true)
            break
          default:
            console.log(key, code, keyCode)
        }
      })
      player.start()
      player.on(Board.EVENT_CHANGE, () => sendBoard(player.data))
      // player.on(Board.EVENT_UPDATE, () => sendPiece())
    } else {
      this.board = new Board()
      const playerView = new PlayerView(this.board)
      dom.appendChild(playerView.el[0])
    }
  }

  componentWillUnmount () {
    // TODO
  }

  render () {
    console.log('Player::render')
    const { player = {}, self } = this.props
    if (!self && this.board) {
      this.board.data = player.data
      this.board.emit(Board.EVENT_UPDATE)
    }
    return (
      <div>
        {player.name}
      </div>
    )
  }
}

export default branch(Player, {
  cursors: (props) => ({
    player: props.playerPath
  })
})
