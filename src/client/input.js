import {EventEmitter} from 'events'

const emitter = new EventEmitter()
emitter.delay = 150
emitter.interval = 50
const timers = {}

document.addEventListener('keydown', (e) => {
  if (timers[e.which]) {
    e.preventDefault()
    return
  }
  emitter.emit('keydown', e)
  emitter.emit('input', e)
  const trigger = () => {
    emitter.emit('input', e)
    timers[e.which] = setTimeout(trigger, emitter.interval)
  }
  timers[e.which] = setTimeout(trigger, emitter.delay)
})

document.addEventListener('keyup', (e) => {
  clearTimeout(timers[e.which])
  delete timers[e.which]
  emitter.emit('keyup', e)
})

export default emitter
