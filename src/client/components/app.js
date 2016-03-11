import React, {Component} from 'react'
import {root} from 'baobab-react/higher-order'
import tree from '../state'
import Rooms from './rooms'

class App extends Component {
  render () {
    return <Rooms />
  }
}

export default root(App, tree)
