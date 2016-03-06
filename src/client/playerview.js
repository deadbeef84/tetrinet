import $ from 'jquery'
import Player from '../common/tetrinet/player'
import Board from '../common/tetrinet/board'
import Special from '../common/tetrinet/special'

export default class PlayerView {
  constructor (player) {
    this.player = player
    this.isPlayer = this.player instanceof Player
    this.notifierSlots = []
    this.nukeTimer = 0
    this.dom = null

    this.el = $(
      '<div class="player"><div class="board"></div><h2>Player</h2><div class="nextpiece"></div><div class="holdpiece"></div><div class="inventory"></div></div>')

    this.build()
    this.render()

    this.player.on(Board.EVENT_UPDATE, () => {
      this.render()
    })
    this.player.on(Board.EVENT_CHANGE, () => {
      this.render()
    })
    this.player.on(Player.EVENT_INVENTORY, () => {
      this.renderInventory()
    })
    this.player.on(Board.EVENT_REMOVE_LINE, (y) => {
      this.removeLine(y)
    })
    this.player.on(Player.EVENT_SPECIAL, (msg) => {
      switch (msg.s) {
        case Special.NUKE:
          this.specialNuke()
          break
        case Special.QUAKE:
          this.specialQuake()
          break
        case Special.BOMB:
          this.specialBomb()
          break
        case Special.MOSES:
          this.specialMoses()
          break
        case Special.ZEBRA:
          this.specialZebra()
          break
        case Special.CLEAR_SPECIALS:
          this.specialClearSpecials()
          break
        case Special.INVENTORY_BOMB:
          this.specialInventoryBomb()
          break
      }
    })
    this.player.on(Player.EVENT_NOTIFY, (msg) => {
      let offset = 0
      const $msg = $(msg)
      for (let i = 0; this.notifierSlots[i]; i++, offset++) {
        this.notifierSlots[offset] = true
      }
      $msg.data('offset', offset)
      $msg.css('top', offset * 50)
      setTimeout((obj) => {
        obj.animate({'opacity': 0}, 500, () => {
          this.notifierSlots[obj.data('offset')] = false
          obj.remove()
        })
      }, 2000, $msg)
      this.el.append($msg)
    })
  }

  build () {
    let x, y, r

    const board = this.el.find('.board').empty()
    this.dom = {}

    let wrapper = $('<div class="board-wrapper" />')
    for (y = Board.VANISH_ZONE_HEIGHT; y < this.player.height; ++y) {
      this.dom[y] = []
      r = $('<div class="row" />').appendTo(wrapper)
      for (x = 0; x < this.player.width; ++x) {
        this.dom[y][x] = $('<div />').appendTo(r)[0]
      }
    }
    wrapper.appendTo(board)

    if (this.isPlayer) {
      this.dom['toprow'] = []
      r = $('<div class="toprow-wrapper"><div class="row"></div></div>').prependTo(board).find('.row')
      for (x = 0; x < this.player.width; ++x) {
        this.dom['toprow'][x] = $('<div />').appendTo(r)[0]
      }

      wrapper = this.el.find('.nextpiece').empty()
      for (let i = 0; i < this.player.options.nextpiece; i++) {
        if (i) {
          $('<div class="row empty"></div>').appendTo(wrapper)
        }
        for (y = 0; y < 2; ++y) {
          this.dom[`nb${i * 2 + y}`] = []
          r = $('<div class="row"></div>').appendTo(wrapper)
          for (x = 0; x < 4; ++x) {
            this.dom[`nb${i * 2 + y}`][x] = $('<div />').appendTo(r)[0]
          }
        }
      }

      wrapper = this.el.find('.holdpiece').empty()
      for (y = 0; y < 2; ++y) {
        this.dom[`hp${y}`] = []
        r = $('<div class="row"></div>').appendTo(wrapper)
        for (x = 0; x < 4; ++x) {
          this.dom[`hp${y}`][x] = $('<div />').appendTo(r)[0]
        }
      }
    }
  }

  render () {
    let x, y, b

    // update ghost block
    if (this.isPlayer) {
      this.player.updateGhostBlock()
    }

    // update board
    for (y = Board.VANISH_ZONE_HEIGHT; y < this.player.height; ++y) {
      for (x = 0; x < this.player.width; ++x) {
        b = this.player.at(x, y)
        this.dom[y][x].className = `cell ${b !== 0 ? (typeof b === 'string' ? 'special special-' + b : 'block block-' + b) : 'empty'}`
      }
    }

    if (!this.isPlayer) {
      return
    }

    // update toprow
    for (x = 0; x < this.player.width; ++x) {
      b = this.player.at(x, Board.VANISH_ZONE_HEIGHT - 1)
      this.dom['toprow'][x].className = `cell ${b !== 0 ? (typeof b === 'string' ? 'special special-' + b : 'block block-' + b) : 'empty'}`
    }

    // update preview (next) blocks
    if (this.player.nextBlocks && this.player.nextBlocks.length) {
      for (let i = 0; i < this.player.options.nextpiece; i++) {
        let bp = {}
        const nextBlock = this.player.nextBlocks[i]
        for (x = 0; x < nextBlock.data.length; ++x) {
          bp[`${nextBlock.data[x][0]}_${nextBlock.data[x][1]}`] = nextBlock.type + 1
        }
        for (y = 0; y < 2; ++y) {
          for (x = 0; x < 4; ++x) {
            b = bp[`${x}_${y}`]
            this.dom[`nb${i * 2 + y}`][x].className = `cell ${b ? 'block block-' + (i > 0 ? '8' : b) : 'empty'}`
          }
        }
      }
    }

    // Update hold block
    if (this.player.holdBlock) {
      let bp = {}
      const holdBlock = this.player.holdBlock
      for (x = 0; x < holdBlock.data.length; ++x) {
        bp[`${holdBlock.data[x][0]}_${holdBlock.data[x][1]}`] = holdBlock.type + 1
      }
      for (y = 0; y < 2; ++y) {
        for (x = 0; x < 4; ++x) {
          b = bp[`${x}_${y}`]
          this.dom[`hp${y}`][x].className = `cell ${b ? 'block block-' + b : 'empty'}`
        }
      }
    } else {
      for (y = 0; y < 2; ++y) {
        for (x = 0; x < 4; ++x) {
          this.dom[`hp${y}`][x].className = 'cell empty'
        }
      }
    }
  }

  renderInventory () {
    const inv = this.player.inventory
    let html = '<div class="row">'
    for (let i = 0; inv && i < inv.length; ++i) {
      const b = inv[i]
      html += `<div class="cell ${b !== 0 ? (typeof b === 'string' ? 'special special-' + b : 'block block-' + b) : 'empty'}"> </div>`
    }
    html += '</div>'
    if (inv.length) {
      html += `<p>${Special.getSpecial(inv[0]).name}</p>`
    }
    this.el.find('.inventory').html(html)
  }

  removeLine (y) {
    const row = y - Board.VANISH_ZONE_HEIGHT
    if (row > 0) {
      const $original = this.el.find('.board-wrapper .row').eq(row)
      const $clear = $original.clone()
        .appendTo(this.el)
        .css({position: 'absolute'})
        .offset($original.offset())
        .animate({top: '+=20px', opacity: 0}, 250, () => $clear.remove())
    }
  }

  specialNuke () {
    var $board = this.el.find('.board')
    const center = $board.offset()
    center.left += $board.width() / 2
    center.top += $board.height() / 2

    $board.find('.special, .block').each(function () {
      const o = $(this).offset()
      const d = {
        left: o.left - center.left,
        top: o.top - center.top
      }
      const m = 1 / Math.sqrt(d.left * d.left + d.top * d.top)
      d.left *= m * (200 + Math.random() * 250)
      d.top *= m * (200 + Math.random() * 250)
      $(this).clone()
        .appendTo($board)
        .css({position: 'absolute'})
        .offset(o)
        .animate(
          {left: `+=${d.left}px`, top: `+=${d.top}px`},
          250 + Math.random() * 250,
          function () { $(this).remove() }
      )
    })

    $board
      .addClass('nuke')
      .css({
        background: `black center bottom no-repeat url('../images/nuke.gif?${Date.now()}')`,
        'background-size': 'cover'
      })
    if (this.nukeTimer) {
      clearTimeout(this.nukeTimer)
    }
    this.nukeTimer = setTimeout(function () {
      $board.removeClass('nuke').css('background', 'transparent')
      this.nukeTimer = 0
    }, 1800) // 60 frames * 0.03 seconds
  }

  specialQuake () {
    PlayerView.shakeObject(this.el.find('.board'), 20, 50, 30, 30, 0)
  }

  specialBomb () {
    const self = this
    this.el.find('.board-wrapper .special-b').each(function () {
      const node = $('<div class="explosion" />')
        .offset($(this).offset())
        .appendTo('#container')
        .css({'background-image': `url('../images/explosion.gif?${Date.now()}')`})
      if (!self.isPlayer) {
        node.css({'-webkit-transform': 'scale(0.5)'})
      }
      setTimeout((obj) => obj.remove(), 2000, node)
    })
  }

  specialMoses () {
    const $rainbow = $('<div class="nyancat-rainbow" />')
    const $nyancat = $('<div class="nyancat" />')
    const centerOffset = this.el.find('.board .row:first').children().eq(Math.floor(this.player.width / 2)).offset()
    const boardHeight = this.el.find('.board').height()
    centerOffset.left -= 3
    $rainbow.appendTo('#container')
      .offset(centerOffset)
      .css({height: 0})
      .animate({ height: boardHeight }, 1000, function () {
        $(this).animate({ opacity: 0 }, 1000, function () { $(this).remove() })
      })
    $nyancat.appendTo('#container')
      .offset(centerOffset)
      .css({top: centerOffset.top - 8})
      .animate({ top: `+=${boardHeight}` }, 1000, function () { $(this).remove() })
    if (!this.isPlayer) {
      centerOffset.left -= 5
      $nyancat.add($rainbow).offset(centerOffset)
      $nyancat.css({'-webkit-transform': 'scale(0.5)'})
      $rainbow.css({'-webkit-transform': 'scaleX(0.5)'})
    }
  }

  specialZebra () {
    if (!this.isPlayer) {
      this.player.zebra = typeof this.player.zebra === 'undefined' ? false : !this.player.zebra
    }
    const animationDir = this.player.zebra ? '-' : '+'
    const animationLen = this.isPlayer ? 200 : 100
    const $rows = this.el.find('.board-wrapper .row')
    for (let x = (this.player.zebra ? 1 : 0), i = 0; x < this.player.width; x += 2, i++) {
      const $column = $('<div class="column"/>')
      for (let y = Board.VANISH_ZONE_HEIGHT; y < this.player.height; y++) {
        let b = this.player.data[y * this.player.width + x]
        if (this.isPlayer && this.player.invisible) {
          if (!this.player.inBlockVisinity(x, y)) {
            b = 0
          }
        }
        const $cell = $('<div class="cell"/>')
        $cell.addClass(
          b !== 0 ? (typeof b === 'string' ? `special special-${b}` : `block block-${b}`) : 'empty'
        )
        $column.append($cell)
      }
      $column.appendTo(this.el)
        .css({position: 'absolute'})
        .offset($rows.first().find('.cell').eq(x).offset())
      setTimeout((obj) => {
        obj.animate(
          {top: `${animationDir}=${animationLen}px`, opacity: 0},
          500,
          () => obj.remove()
        )
      }, i * 50, $column)
    }
  }

  specialClearSpecials () {
    const self = this
    this.el.find('.board-wrapper .special').each(function () {
      const node = $('<div class="sparkle" />')
        .offset($(this).offset())
        .appendTo('#container')
        .css({'background-image': `url('../images/sparkle.gif?${Date.now()}')`})
      if (!self.isPlayer) {
        node.css({'-webkit-transform': 'scale(0.5)'})
      }
      node.fadeOut(4000, () => node.remove())
    })
  }

  specialInventoryBomb () {
    const self = this
    const $inventory = this.el.find('.inventory')
    $inventory.find('.cell').each(function (i, obj) {
      const $clone = $(this).clone()
        .appendTo(self.el)
        .css({position: 'absolute'})
        .offset($(this).offset())
      PlayerView.shakeObject($clone, 30, 50, 10, 5, 0, function () { this.fadeOut(200) })
    })
    $inventory.addClass('bomb')
    setTimeout(() => $inventory.removeClass('bomb'), 30 * 50)
  }
}

PlayerView.shakeObject = (obj, count, delay, width, height, defaultMargin, callback) => {
  const args = {
    obj,
    count,
    countStart: count,
    delay,
    width,
    height,
    defaultMargin,
    callback
  }
  const shake = (args) => {
    if (args.count--) {
      const factor = (args.count + 1) / args.countStart
      const horizontal = Math.round(Math.random() * (args.count & 1 ? -1 : 1) * args.width * factor)
      const vertical = Math.round((Math.random() - 0.5) * args.height * factor)
      args.obj.css({
        'margin-left': horizontal,
        'margin-right': -horizontal,
        'margin-top': vertical,
        'margin-bottom': -vertical
      })
      setTimeout(shake, args.delay, args)
    } else {
      args.obj.css('margin', args.defaultMargin)
      if (typeof args.callback === 'function') {
        args.callback.call(args.obj)
      }
    }
  }
  shake(args)
}
