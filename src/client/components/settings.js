import React, {Component} from 'react'
import keycode from 'keycode'

const storage = window.localStorage
const defaultSettings = {
  name: '',
  ghostBlock: true,
  inputDelay: 300,
  inputInterval: 50,
  keyLeft: keycode('left'),
  keyRight: keycode('right'),
  keyDown: keycode('down'),
  keyDrop: keycode('space'),
  keySoftDrop: keycode('ctrl'),
  keyHold: keycode('shift'),
  keyTalk: keycode('t'),
  keyRotateCw: keycode('up'),
  keyRotateCcw: keycode('z'),
  keyInventory1: keycode('1'),
  keyInventory2: keycode('2'),
  keyInventory3: keycode('3'),
  keyInventory4: keycode('4'),
  keyInventory5: keycode('5'),
  keyInventory6: keycode('6'),
  keyInventory7: keycode('7'),
  keyInventory8: keycode('8'),
  keyInventory9: keycode('9'),
  keyInventorySelf: keycode('s')
}

export default class Settings extends Component {
  state = {
    show: false
  }

  componentDidMount () {
    const settings = Object.keys(defaultSettings)
      .reduce((acc, prop) => {
        acc[prop] = get(prop)
        return acc
      }, {})
    this.setState(settings)
  }

  render () {
    const {show} = this.state
    if (!show) {
      return (
        <div>
          <h2 onClick={() => this.setState({show: !show})}>Settings</h2>
        </div>
      )
    }
    return (
      <div>
        <h2 onClick={() => this.setState({show: !show})}>Settings</h2>
        {Object.entries(defaultSettings).map(([prop, defaultValue]) => {
          const label = prop
          const value = this.state[prop]
          if (typeof defaultValue === 'string') {
            return (
              <div key={prop}>
                <label>{label}</label>
                <input value={value} onChange={({target}) => this::update(prop, target.value)}/>
              </div>
            )
          } else if (typeof defaultValue === 'boolean') {
            return (
              <div key={prop}>
                <label>
                  {label}
                  <input type='checkbox' checked={value} onChange={({target}) => this::update(prop, target.checked)}/>
                </label>
              </div>
            )
          } else if (typeof defaultValue === 'number') {
            return /^key/.test(prop)
              ? (
                <div key={prop}>
                  <label>
                    {label}
                    <input type='input' value={keycode(value)} onChange={() => {}} onKeyDown={({which}) => this::update(prop, which)}/>
                  </label>
                </div>
              )
              : (
                <div key={prop}>
                  <label>
                    {label}
                    <input type='number' value={value} onChange={({target}) => this::update(prop, target.value)}/>
                  </label>
                </div>
              )
          }
        })}
      </div>
    )
  }
}

function update (prop, value) {
  this.setState({[prop]: value})
  set(prop, value)
}

export function get (prop) {
  const value = storage.getItem(prop)
  return value !== null ? JSON.parse(value) : defaultSettings[prop]
}

export function set (prop, value) {
  storage.setItem(prop, JSON.stringify(value))
}
