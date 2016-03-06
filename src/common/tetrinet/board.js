import EventEmitter from 'events'
import Block from './block'

export default class Board extends EventEmitter {
  static VANISH_ZONE_HEIGHT = 4;

  static EVENT_UPDATE = 'update';
  static EVENT_CHANGE = 'change';
  static EVENT_LINES = 'lines';
  static EVENT_REMOVE_LINE = 'remove line';
  static EVENT_PUT_BLOCK = 'putblock';

  static NO_COLLISION = 0;
  static COLLISION_BLOCKS = 1;
  static COLLISION_BOUNDS = 2;

  constructor () {
    super()
    this.width = 12
    this.height = 24 + Board.VANISH_ZONE_HEIGHT
    this.data = []
    this.currentBlock = null
    this.clear()
  }

  setSize (w, h) {
    this.width = w
    this.height = h + Board.VANISH_ZONE_HEIGHT
    this.data = []
    this.clear()
  }

  clear () {
    for (let i = 0; i < this.width * this.height; ++i) {
      this.data[i] = 0
    }
  }

  at (x, y) {
    if (this.currentBlock && this.currentBlock.hasPieceAt(x, y)) {
      return this.currentBlock.type + 1
    }
    return this.data[y * this.width + x]
  }

  checklines (action) {
    let l = 0
    let removed = []
    for (let y = this.height - 1; y >= 0; --y) {
      let t = true
      for (let x = 0; x < this.width; ++x) {
        t = t && this.data[y * this.width + x]
      }
      if (t) {
        this.emit(Board.EVENT_REMOVE_LINE, y - l)
        removed = removed.concat(this.data.splice(y * this.width, this.width))
        for (let x = 0; x < this.width; ++x) { // add empty line to the top
          this.data.unshift(0)
        }
        ++l
        ++y
      }
    }
    if (action) {
      this.onRemoveLines(l, removed)
    }
  }

  onRemoveLines (lines, removed) {
    this.emit(Board.EVENT_LINES, lines)
  }

  addLines (numLines) {
    this.data.splice(0, numLines * this.width)
    for (let y = 0; y < numLines; ++y) {
      const empty = Math.floor(Math.random() * this.width)
      for (let x = 0; x < this.width; ++x) {
        this.data.push(x === empty ? 0 : 1 + Math.floor(Math.random() * Block.blockData.length))
      }
    }
  }

  putBlock (block) {
    for (let i = 0; i < block.data.length; ++i) {
      let x = block.x + block.data[i][0]
      let y = block.y + block.data[i][1]
      if (y >= 0) {
        this.data[y * this.width + x] = block.type + 1
      }
    }
    this.emit(Board.EVENT_PUT_BLOCK)
    this.checklines(true)
  }

  collide (block) {
    // check bounds
    let bx, by
    for (let i = 0; i < block.data.length; ++i) {
      bx = block.x + block.data[i][0]
      by = block.y + block.data[i][1]
      if (bx < 0 || bx >= this.width || by >= this.height) {
        return Board.COLLISION_BOUNDS
      }
    }
    // check collision
    for (let i = 0; i < block.data.length; ++i) {
      bx = block.x + block.data[i][0]
      by = block.y + block.data[i][1]
      if (this.data[by * this.width + bx]) {
        return Board.COLLISION_BLOCKS
      }
    }
    return Board.NO_COLLISION
  }
}
