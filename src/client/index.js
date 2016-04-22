import React from 'react'
import {render} from 'react-dom'
import App from './components/app'
import './css/style.css'

const container = document.createElement('div')
document.body.appendChild(container)

render(
  <App/>,
  container
)
