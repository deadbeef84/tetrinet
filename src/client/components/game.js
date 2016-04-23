import React, {Component} from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'baobab-react/prop-types'
import {branch} from 'baobab-react/higher-order'
import PIXI from 'pixi.js'
import Player from '../pixi/player'

class Game extends Component {
  static contextTypes = {
    cursors: PropTypes.cursors
  }

  players = {}

  componentDidMount () {
    console.log('animate')
    const dom = ReactDOM.findDOMNode(this)
    const renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, {backgroundColor: 0x1099bb})
    dom.appendChild(renderer.view)
    this.stage = new PIXI.Container()

    const animate = () => {
      requestAnimationFrame(animate)
      renderer.render(this.stage)
    }
    animate()

    this.componentWillReceiveProps(this.props)
  }

  componentWillReceiveProps ({room}) {
    const roomCursor = this.context.cursors.room

    Object.keys(room.players)
      .filter(id => !(id in this.players))
      .map((id) => {
        console.log(`Adding player ${id}`)
        const player = new Player(id, roomCursor.select('players', id), roomCursor)
        this.stage.addChild(player)
        this.players[id] = player
      })

    Object.keys(this.players)
      .filter(id => !(id in room.players))
      .map((id) => {
        console.log(`Removing player ${id}`)
        const player = this.players[id]
        player.dispose()
        this.stage.removeChild(player)
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

export default branch(Game, {
  cursors: (props) => ({
    room: props.roomPath
  })
})
