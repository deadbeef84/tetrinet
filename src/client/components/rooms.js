import React, {Component} from 'react'
import {branch} from 'baobab-react/higher-order'
import {selectRoom} from '../actions'
import Game from './game'

class Rooms extends Component {
  state = {}

  render () {
    const { rooms } = this.props
    const { id: selectedId, room } = this.state

    if (selectedId && room) {
      return <Game roomPath={room} />
    }

    return (
      <div>
        <h2>Select room</h2>
        {Object.entries(rooms || {}).map(([id, {name}]) =>
          <div style={{cursor: 'pointer'}} key={id} onClick={() => this::join(id)}>Room: {name}</div>)}
      </div>
    )
  }
}

function join (id) {
  selectRoom(id)
    .then((state) => this.setState(state))
}

export default branch(Rooms, {
  cursors: {
    rooms: ['rooms']
  }
})
