import Block, { blockData } from './block'
import Board from './board'
import Player from './player'

export default class Bot extends Player {
  constructor (game) {
    super()
    this.game = game

    this.processBlock = (event) => {
      if (this.isPlaying) {
        this.syncBoard()
        this.moveBlock(this.ai.play(this.currentBlock.type))
      }
    }

    this.on(Board.EVENT_CHANGE, () => this.syncBoard())
    this.on(Player.EVENT_NEW_BLOCK, () => this.processBlock())
    this.ai = new ElTetris(this.width, this.height)
  }

  syncBoard () {
    for (let y = 0; y < this.height; y++) {
      let row = ''
      for (let x = 0; x < this.width; x++) {
        row += this.data[(this.height - 1 - y) * this.width + x] ? '1' : '0'
      }
      this.ai.board[y] = parse(row)
    }
  }

  getBoardHeight (player) {
    let maxHeight = 0
    for (let y = player.height - 1; y >= 0; --y) {
      for (let x = 0; x < player.width; ++x) {
        if (player.data[y * player.width + x]) {
          maxHeight = player.height - y
          break
        }
      }
    }
    return maxHeight
  }

  moveBlock (target) {
    // if (this.specials && this.inventory.length > 0) {
    //   switch (this.inventory[0]) {
    //     // good
    //     case Player.SPECIAL_REFLECT:
    //       this.game.use(this.id)
    //       break
    //     case Player.SPECIAL_CLEAR_LINE:
    //       if (this.getBoardHeight(this) > 1) {
    //         this.game.use(this.id)
    //       }
    //       break
    //     case Player.SPECIAL_SWITCH:
    //       if (this.game.players.length === 1) {
    //         this.game.use(this.id)
    //         break
    //       }
    //       const boardHeight = this.getBoardHeight(this)
    //       for (i in this.game.players) {
    //         if (this.getBoardHeight(this.game.players[i]) < boardHeight) {
    //           this.game.use(this.game.players[i].id)
    //         }
    //       }
    //       break
    //     case Player.SPECIAL_NUKE:
    //     case Player.SPECIAL_GRAVITY:
    //     case Player.SPECIAL_LGRAVITY:
    //     case Player.SPECIAL_MOSES:
    //       if (this.getBoardHeight(this) >= this.height / 2) {
    //         this.game.use(this.id)
    //       }
    //       break
    //     // bad
    //     case Player.SPECIAL_ADD_LINE:
    //     case Player.SPECIAL_QUAKE:
    //     case Player.SPECIAL_CLEAR_RANDOM:
    //     case Player.SPECIAL_BOMB:
    //     case Player.SPECIAL_ZEBRA:
    //     case Player.SPECIAL_FLIP:
    //     case Player.SPECIAL_INVISIBLE:
    //     case Player.SPECIAL_GAMEOFLIFE:
    //     case Player.SPECIAL_GLUE:
    //     case Player.SPECIAL_RICKROLL:
    //     case Player.SPECIAL_INVERT:
    //     case Player.SPECIAL_SPEED:
    //     case Player.SPECIAL_RANDOM:
    //     case Player.SPECIAL_SBLOCKS:
    //     default:
    //       if (Math.random() > 0.1) {
    //         break
    //       }
    //       const playerIds = []
    //       for (var i in this.game.players) {
    //         if (this.game.players[i].id !== this.id) {
    //           playerIds.push(this.game.players[i].id)
    //         }
    //       }
    //       this.game.use(playerIds[Math.floor(playerIds.length * Math.random())])
    //       break
    //   }
    //   this.syncBoard()
    // }
    let finished = true
    if (this.currentBlock) {
      if (this.currentBlock.rotation !== parseInt(target.orientation, 10)) {
        this.move(0, 0, 1)
        finished = false
      } else if (this.currentBlock.x !== target.column) {
        let dir = this.currentBlock.x < target.column ? 1 : -1
        if (this.flip && Math.random() < 0.5) {
          dir *= -1
        }
        this.move(dir, 0, 0)
        finished = false
      }
    }
    if (finished) {
      this.falldown(true)
    } else {
      setTimeout(() => this.moveBlock(target), Bot.MOVE_DELAY)
    }
  }
}

Bot.MOVE_DELAY = 100

class ElTetris {
  constructor (number_of_columns, number_of_rows) {
    this.number_of_rows = number_of_rows
    this.number_of_columns = number_of_columns
    this.rows_completed = 0

    // The board is represented as an array of integers, one integer for each row.
    this.board = new Array(number_of_rows)
    for (let i = 0; i < number_of_rows; i++) {
      this.board[i] = 0
    }

    this.FULLROW = Math.pow(2, number_of_columns) - 1
  }

  play (piece) {
    const move = this.pickMove(PIECES[piece])

    const last_move = this.playMove(this.board, move.piece_data, move.column)

    if (!last_move.game_over) {
      this.rows_completed += last_move.rows_removed
    }

    return move
  }

  pickMove (piece) {
    let best_evaluation = -100000
    let best_orientation = 0
    let best_column = 0

    // Evaluate all possible orientations
    for (let i in piece) {
      const orientation = piece[i].orientation

      // Evaluate all possible columns
      for (let j = 0; j < this.number_of_columns - piece[i].width + 1; j++) {
        // Copy current board
        const board = this.board.slice()
        const last_move = this.playMove(board, orientation, j)

        if (!last_move.game_over) {
          let evaluation = this.evaluateBoard(last_move, board)

          if (evaluation > best_evaluation) {
            best_evaluation = evaluation
            best_orientation = i
            best_column = j
          }
        }
      }
    }

    return {
      'piece_data': piece[best_orientation].orientation,
      'orientation': best_orientation,
      'column': best_column - piece[best_orientation].offset
    }
  }

  evaluateBoard (last_move, board) {
    return GetLandingHeight(last_move, board) * -4.500158825082766 +
    last_move.rows_removed * 3.4181268101392694 +
    GetRowTransitions(board, this.number_of_columns) * -3.2178882868487753 +
    GetColumnTransitions(board, this.number_of_columns) * -9.348695305445199 +
    GetNumberOfHoles(board, this.number_of_columns) * -7.899265427351652 +
    GetWellSums(board, this.number_of_columns) * -3.3855972247263626
  }

  playMove (board, piece, column) {
    piece = this.movePiece(piece, column)
    const placementRow = this.getPlacementRow(board, piece)
    let rowsRemoved = 0

    if (placementRow + piece.length > this.number_of_rows) {
      // Game over.
      return { 'game_over': true }
    }

    // Add piece to board.
    for (let i = 0; i < piece.length; i++) {
      board[placementRow + i] |= piece[i]
    }

    // Remove any full rows
    for (let i = 0; i < piece.length; i++) {
      if (board[placementRow + i] === this.FULLROW) {
        board.splice(placementRow + i, 1)
        // Add an empty row on top.
        board.push(0)
        // Since we have decreased the number of rows by one, we need to adjust
        // the index accordingly.
        i--
        rowsRemoved++
      }
    }

    return {
      'landing_height': placementRow,
      'piece': piece,
      'rows_removed': rowsRemoved,
      'game_over': false
    }
  }

  getPlacementRow (board, piece) {
    // Descend from top to find the highest row that will collide
    // with the our piece.
    for (let row = this.number_of_rows - piece.length; row >= 0; row--) {
      // Check if piece collides with the cells of the current row.
      for (let i = 0; i < piece.length; i++) {
        if ((board[row + i] & piece[i]) !== 0) {
          // Found collision - place piece on row above.
          return row + 1
        }
      }
    }

    return 0 // No collision found, piece should be placed on first row.
  }

  movePiece (piece, column) {
    // Make a new copy of the piece
    const newPiece = piece.slice()
    for (let i = 0; i < piece.length; i++) {
      newPiece[i] = piece[i] << column
    }

    return newPiece
  }
}

function GetLandingHeight (last_move, board) {
  return last_move.landing_height + ((last_move.piece.length - 1) / 2)
}

function GetRowTransitions (board, num_columns) {
  let transitions = 0
  let last_bit = 1

  for (let i = 0; i < board.length; ++i) {
    const row = board[i]

    for (let j = 0; j < num_columns; ++j) {
      var bit = (row >> j) & 1

      if (bit !== last_bit) {
        ++transitions
      }

      last_bit = bit
    }

    if (bit === 0) {
      ++transitions
    }
    last_bit = 1
  }
  return transitions
}

function GetColumnTransitions (board, num_columns) {
  let transitions = 0
  let last_bit = 1

  for (let i = 0; i < num_columns; ++i) {
    for (let j = 0; j < board.length; ++j) {
      const row = board[j]
      const bit = (row >> i) & 1

      if (bit !== last_bit) {
        ++transitions
      }

      last_bit = bit
    }

    last_bit = 1
  }

  return transitions
}

function GetNumberOfHoles (board, num_columns) {
  let holes = 0
  let row_holes = 0x0000
  let previous_row = board[board.length - 1]

  for (let i = board.length - 2; i >= 0; --i) {
    row_holes = ~board[i] & (previous_row | row_holes)

    for (let j = 0; j < num_columns; ++j) {
      holes += (row_holes >> j) & 1
    }

    previous_row = board[i]
  }

  return holes
}

function GetWellSums (board, num_columns) {
  let well_sums = 0

  for (let i = 1; i < num_columns - 1; ++i) {
    for (let j = board.length - 1; j >= 0; --j) {
      if ((((board[j] >> i) & 1) === 0) &&
        (((board[j] >> (i - 1)) & 1) === 1) &&
        (((board[j] >> (i + 1)) & 1) === 1)) {
        // Found well cell, count it + the number of empty cells below it.

        ++well_sums
        for (let k = j - 1; k >= 0; --k) {
          if (((board[k] >> i) & 1) === 0) {
            ++well_sums
          } else {
            break
          }
        }
      }
    }
  }

  for (let j = board.length - 1; j >= 0; --j) {
    if ((((board[j] >> 0) & 1) === 0) &&
      (((board[j] >> (0 + 1)) & 1) === 1)) {
      // Found well cell, count it + the number of empty cells below it.

      ++well_sums
      for (let k = j - 1; k >= 0; --k) {
        if (((board[k] >> 0) & 1) === 0) {
          ++well_sums
        } else {
          break
        }
      }
    }
  }

  for (let j = board.length - 1; j >= 0; --j) {
    if ((((board[j] >> (num_columns - 1)) & 1) === 0) &&
      (((board[j] >> (num_columns - 2)) & 1) === 1)) {
      // Found well cell, count it + the number of empty cells below it.

      ++well_sums
      for (let k = j - 1; k >= 0; --k) {
        if (((board[k] >> (num_columns - 1)) & 1) === 0) {
          ++well_sums
        } else {
          break
        }
      }
    }
  }

  return well_sums
}

/**
 * Defines the shapes and dimensions of the tetrominoes.
 */
const PIECES = []

for (let i in blockData) {
  PIECES[i] = []
  for (let j in blockData[i]) {
    const block = new Block(i, j)
    const bb = block.getBoundingBox()
    const piece = {
      width: bb.maxx - bb.minx + 1,
      height: bb.maxy - bb.miny + 1,
      offset: bb.minx
    }
    const orientation = []
    for (var y = 0; y < piece.height; y++) {
      orientation.push('')
      for (var x = 0; x < piece.width; x++) {
        orientation[y] += '0'
      }
    }
    for (let k in blockData[i][j]) {
      const x = blockData[i][j][k][0] - bb.minx
      const y = blockData[i][j][k][1] - bb.miny
      orientation[y] = `${orientation[y].substr(0, x)}1${orientation[y].substr(x + 1)}`
    }
    for (let y = 0; y < piece.height; y++) {
      orientation[y] = parse(orientation[y])
    }
    piece.orientation = orientation.reverse()
    PIECES[i].push(piece)
  }
}

function parse (x) {
  return parseInt(x.split('').reverse().join(''), 2)
}
