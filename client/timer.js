import EventEmitter from 'events'

export default class Timer extends EventEmitter {
  constructor (delay, count = Infinity) {
    super()
    this.delay = delay
    this.count = count
    this.currentCount = 0
    this.intervalId = null
    this.startTime = null
  }

  start () {
    this.stop()
    this.currentCount = 0
    this.startTime = Date.now()
    this.intervalId = setInterval(() => {
      ++this.currentCount
      this.emit(Timer.EVENT_TIMER)
      if (this.currentCount >= this.count) {
        this.stop()
        this.emit(Timer.EVENT_TIMER_COMPLETE)
      }
    }, this.delay)
  }

  stop () {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  isRunning () {
    return !!this.intervalId
  }

  time () {
    return Date.now() - this.startTime
  }

  addDelay (time) {
    this.delay = this.isRunning() ? time + Math.max(0, this.delay - this.time()) : time
  }
}

Timer.EVENT_TIMER = 'timer'
Timer.EVENT_TIMER_COMPLETE = 'timerComplete'
