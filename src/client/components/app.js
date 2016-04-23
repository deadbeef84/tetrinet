import React, {Component} from 'react'
import {root} from 'baobab-react/higher-order'
import tree from '../state'
import Rooms from './rooms'
import Settings from './settings'

class App extends Component {
  render () {
    return <div>
      <Rooms />
      <Settings />
    </div>
  }
}

export default root(App, tree)
