import React, {Component} from 'react'
import PropTypes from 'baobab-react/prop-types'
import {branch} from 'baobab-react/higher-order'
import Player from './player'
import client from '../client'

class Game extends Component {
  static contextTypes = {
    cursors: PropTypes.cursors
  }

  render () {
    const { room = {}, roomPath } = this.props
    return (
      <div>
        {Object.keys(room.players).map((id) =>
          <Player
            key={id}
            self={id === client.id}
            playerPath={[...roomPath, 'players', id]}
          />
        )}
      </div>
    )
  }
}

export default branch(Game, {
  cursors: (props) => ({
    room: props.roomPath
  })
})
