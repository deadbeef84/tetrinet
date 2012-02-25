function Bot(game) {
	
	this.game = game;
	this.active = false;
	
	var self = this;
	
	this.processBlock = function(event) {
		if (self.active && self.game.player.isPlaying) {
			//self.syncBoard();
			self.moveBlock(self.ai.play(self.game.player.currentBlock.type));
		}
	};
	
	this.checkForPlayer = function() {
		if (self.game.player) {
			self.game.player.on(Board.EVENT_CHANGE, function() { self.syncBoard(); });
			self.game.player.on(Player.EVENT_NEW_BLOCK, function() { self.processBlock(); });
			self.ai = new ElTetris(self.game.player.width, self.game.player.height);
			self.active = true;
		} else {
			setTimeout(self.checkForPlayer, 200);
		}
	};
	
	this.checkForPlayer();
	
	$('<p><input type="checkbox" id="autoplay" checked="checked"/><label for="autoplay">Autoplay</label></p>').appendTo('#ingame');
	$('#autoplay').change(function(){ self.active = $(this).is(':checked'); self.processBlock(); });
}

Bot.MOVE_DELAY = 100;

Bot.prototype.syncBoard = function() {
	for (var y = 0; y < this.game.player.height; y++) {
		var row = "";
		for (var x = 0; x < this.game.player.width; x++) {
			row += this.game.player.data[(this.game.player.height - 1 - y) * this.game.player.width + x] ? "1" : "0";
		}
		this.ai.board[y] = parseInt(row.split("").reverse().join(""), 2);
	}
}

Bot.prototype.getBoardHeight = function(player) {
	var maxHeight = 0;
	for(var y = player.height-1; y >= 0; --y) {
		for(var x = 0; x < player.width; ++x) {
			if(player.data[y * player.width + x]) {
				maxHeight = player.height - y;
				break;
			}
		}
	}
	return maxHeight;
}

Bot.prototype.moveBlock = function(target) {

	if (this.game.player.specials && this.game.player.inventory.length > 0) {
		switch(this.game.player.inventory[0]) {
			// good
            case Player.SPECIAL_REFLECT:
                this.game.use(this.game.player.id);
                break;
			case Player.SPECIAL_CLEAR_LINE:
                if (this.getBoardHeight(this.game.player) > 1)
                    this.game.use(this.game.player.id);
                break;
			case Player.SPECIAL_SWITCH:
                if (this.game.players.length == 1) {
                    this.game.use(this.game.player.id);
                    break;
                }
                var boardHeight = this.getBoardHeight(this.game.player);
                for (i in this.game.players) {
                    if (this.getBoardHeight(this.game.players[i]) < boardHeight) {
                        this.game.use(this.game.players[i].id);
                    }
                }
				break;
			case Player.SPECIAL_NUKE:
			case Player.SPECIAL_GRAVITY:
			case Player.SPECIAL_LGRAVITY:
			case Player.SPECIAL_MOSES:
				if (this.getBoardHeight(this.game.player) >= this.game.player.height/2)
					this.game.use(this.game.player.id);
				break;
			// bad
			case Player.SPECIAL_ADD_LINE:
			case Player.SPECIAL_QUAKE:
			case Player.SPECIAL_CLEAR_RANDOM:
			case Player.SPECIAL_BOMB:
			case Player.SPECIAL_ZEBRA:
			case Player.SPECIAL_FLIP:
			case Player.SPECIAL_INVISIBLE:
			case Player.SPECIAL_GAMEOFLIFE:
			case Player.SPECIAL_GLUE:
			case Player.SPECIAL_RICKROLL:
			case Player.SPECIAL_INVERT:
			case Player.SPECIAL_SPEED:
			case Player.SPECIAL_RANDOM:
			case Player.SPECIAL_SBLOCKS:
			default:
				if (Math.random() > 0.1)
					break;
				var playerIds = [];
				for (var i in this.game.players) {
                    if (this.game.players[i].id != this.game.player.id)
    					playerIds.push(this.game.players[i].id);
                }
				this.game.use(playerIds[Math.floor(playerIds.length * Math.random())]);
				break;
		}
		this.syncBoard();
	}
	var finished = true;
	if (this.game.player.currentBlock != null) {
		if (this.game.player.currentBlock.rotation != parseInt(target.orientation)) {
			this.game.player.move(0, 0, 1);
			finished = false;
		}
		else if (this.game.player.currentBlock.x != target.column) {
			var dir = this.game.player.currentBlock.x < target.column ? 1 : -1;
			if (this.game.player.flip && Math.random() < 0.5)
				dir *= -1;
			this.game.player.move(dir, 0, 0);
			finished = false;
		}
	}
	if (finished) {
		this.game.player.falldown(true);
	} else {
		var self = this;
		window.setTimeout(function(){ self.moveBlock(target); }, Bot.MOVE_DELAY);
		this.game.player.render();
	}
};

/*
  Copyright Islam El-Ashi <islam@elashi.me>

  This file is part of El-Tetris.

  El-Tetris is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  El-Tetris is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with El-Tetris.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * Handles game dynamics (Choosing a piece, placing a piece, etc...)
 */

/**
 * Initialize an El-Tetris game.
 *
 * Args:
 *  number_of_columns - Number of columns in the tetris game.
 *  number_of_rows - Number of rows in the tetris game.
 */
function ElTetris(number_of_columns, number_of_rows) {
  this.number_of_rows = number_of_rows;
  this.number_of_columns = number_of_columns;
  this.rows_completed = 0;

  // The board is represented as an array of integers, one integer for each row.
  this.board = new Array(number_of_rows);
  for (var i = 0; i < number_of_rows; i++) {
    this.board[i] = 0;
  }

  this.FULLROW = Math.pow(2, number_of_columns) - 1;
}

ElTetris.prototype.play = function(piece) {
  var move = this.pickMove(PIECES[piece]);
 
  var last_move = this.playMove(this.board, move.piece_data, move.column);

  if (!last_move.game_over) {
    this.rows_completed += last_move.rows_removed;
  }

  return move;
};

/**
 * Pick the best move possible (orientation and location) as determined by the
 * evaluation function.
 *
 * Given a tetris piece, tries all possible orientations and locations and to
 * calculate (what it thinks) is the best move.
 *
 * Args:
 *  piece - A tetris piece.
 *
 * Returns:
 *   An object containing the following attributes:
 *     * orientation - The orientation of the piece to use.
 *     * column - The column at which to place the piece.
 */
ElTetris.prototype.pickMove = function(piece) {
  var best_evaluation = -100000;
  var best_orientation = 0;
  var best_column = 0;
  var evaluation = undefined;

  // Evaluate all possible orientations
  for (var i in piece) {
    var orientation = piece[i].orientation;

    // Evaluate all possible columns
    for (var j = 0; j < this.number_of_columns - piece[i].width + 1; j++) {
      // Copy current board
      var board = this.board.slice();
      var last_move = this.playMove(board, orientation, j);

      if (!last_move.game_over) {
        evaluation = this.evaluateBoard(last_move, board);

        if (evaluation > best_evaluation) {
          best_evaluation = evaluation;
          best_orientation = i;
          best_column = j;
        }
      }
    }
  }

  return {
    'piece_data': piece[best_orientation].orientation,
    'orientation': best_orientation,
    'column': best_column - piece[best_orientation].offset
  };
};

/**
 * Evaluate the board, giving a higher score to boards that "look" better.
 *
 * Args:
 *   last_move - An object containing the following information on the
 *               last move played:
 *                 * landing_height: the row at which the last piece was played
 *                 * piece: the last piece played
 *                 * rows_removed: how many rows were removed in the last move
 *
 * Returns:
 *   A number indicating how "good" a board is, the higher the number, the
 *   better the board.
 */
ElTetris.prototype.evaluateBoard = function(last_move, board) {
  return GetLandingHeight(last_move, board) * -4.500158825082766 +
      last_move.rows_removed * 3.4181268101392694 +
      GetRowTransitions(board, this.number_of_columns) * -3.2178882868487753 +
      GetColumnTransitions(board, this.number_of_columns) * -9.348695305445199 +
      GetNumberOfHoles(board, this.number_of_columns) * -7.899265427351652 +
      GetWellSums(board, this.number_of_columns) * -3.3855972247263626;
};

/**
 * Play the given piece at the specified location.
 *
 * Args:
 *  board - The game board.
 *  piece - The piece to play.
 *  column - The column at which to place the piece.
 *
 * Returns:
 *   True if play succeeded, False if game is over.
 */
ElTetris.prototype.playMove = function(board, piece, column) {
  piece = this.movePiece(piece, column);
  var placementRow = this.getPlacementRow(board, piece);
  var rowsRemoved = 0;

  if (placementRow + piece.length > this.number_of_rows) {
    // Game over.
    return { 'game_over' : true };
  }

  // Add piece to board.
  for (var i = 0; i < piece.length; i++) {
    board[placementRow + i] |= piece[i];
  }

  // Remove any full rows
  for (i = 0; i < piece.length; i++) {
    if (board[placementRow + i] == this.FULLROW) {
      board.splice(placementRow + i, 1);
      // Add an empty row on top.
      board.push(0);
      // Since we have decreased the number of rows by one, we need to adjust
      // the index accordingly.
      i--;
      rowsRemoved++;
    }
  }

  return {
    'landing_height' : placementRow,
    'piece' : piece,
    'rows_removed' : rowsRemoved,
    'game_over' : false
  };
};

/**
 * Given a piece, return the row at which it should be placed.
 */
ElTetris.prototype.getPlacementRow = function(board, piece) {
  // Descend from top to find the highest row that will collide
  // with the our piece.
  for (var row = this.number_of_rows - piece.length; row >= 0; row--) {
    // Check if piece collides with the cells of the current row.
    for (var i = 0; i < piece.length; i++) {
      if ((board[row + i] & piece[i]) !== 0) {
        // Found collision - place piece on row above.
        return row + 1;
      }
    }
  }

  return 0; // No collision found, piece should be placed on first row.
};

ElTetris.prototype.movePiece = function(piece, column) {
  // Make a new copy of the piece
  var newPiece = piece.slice();
  for (var i = 0; i < piece.length; i++) {
    newPiece[i] = piece[i] << column;
  }

  return newPiece;
};

function GetLandingHeight(last_move, board) {
  return last_move.landing_height + ((last_move.piece.length - 1) / 2);
}

function GetRowTransitions(board, num_columns) {
  var transitions = 0;
  var last_bit = 1;

  for (var i = 0; i < board.length; ++i) {
    var row = board[i];

    for (var j = 0; j < num_columns; ++j) {
      var bit = (row >> j) & 1;
      
      if (bit != last_bit) {
        ++transitions;
      }

      last_bit = bit;
    }

    if (bit == 0) {
      ++transitions;
    }
    last_bit = 1;
  }
  return transitions;
}

function GetColumnTransitions(board, num_columns) {
  var transitions = 0;
  var last_bit = 1;

  for (var i = 0; i < num_columns; ++i) {
    for (var j = 0; j < board.length; ++j) {
      var row = board[j];
      var bit = (row >> i) & 1;
      
      if (bit != last_bit) {
        ++transitions;
      }

      last_bit = bit;
    }

    last_bit = 1;
  }
  
  return transitions;
}

function GetNumberOfHoles(board, num_columns) {
  var holes = 0;
  var row_holes = 0x0000;
  var previous_row = board[board.length - 1];

  for (var i = board.length - 2; i >= 0; --i) {
    row_holes = ~board[i] & (previous_row | row_holes);

    for (var j = 0; j < num_columns; ++j) {
      holes += ((row_holes >> j) & 1);
    }

    previous_row = board[i];
  }

  return holes;
}

function GetWellSums(board, num_columns) {
  var well_sums = 0;

  for (var i = 1; i < num_columns - 1; ++i) {
    for (var j = board.length - 1; j >= 0; --j) {
      if ((((board[j] >> i) & 1) == 0) && 
        (((board[j] >> (i - 1)) & 1) == 1) &&
        (((board[j] >> (i + 1)) & 1) == 1)) {
        // Found well cell, count it + the number of empty cells below it.

        ++well_sums;
        for (var k = j - 1; k >= 0; --k) {
          if (((board[k] >> i) & 1) == 0) {
            ++well_sums;
          } else {
            break;
          }
        }
      }
    }
  }

  for (var j = board.length - 1; j >= 0; --j) {
    if ((((board[j] >> 0) & 1) == 0) && 
      (((board[j] >> (0 + 1)) & 1) == 1)) {
      // Found well cell, count it + the number of empty cells below it.

      ++well_sums;
      for (var k = j - 1; k >= 0; --k) {
        if (((board[k] >> 0) & 1) == 0) {
          ++well_sums;
        } else {
          break;
        }
      }
    }
  }

  for (var j = board.length - 1; j >= 0; --j) {
    if ((((board[j] >> (num_columns - 1)) & 1) == 0) && 
      (((board[j] >> (num_columns - 2)) & 1) == 1)) {
      // Found well cell, count it + the number of empty cells below it.

      ++well_sums;
      for (var k = j - 1; k >= 0; --k) {
        if (((board[k] >> (num_columns - 1)) & 1) == 0) {
          ++well_sums;
        } else {
          break;
        }
      }
    }
  }

  return well_sums;
}

/**
 * Defines the shapes and dimensions of the tetrominoes.
 */
var PIECES = new Array();

for (i in Block.blockData) {
    PIECES[i] = [];
    for (j in Block.blockData[i]) {
        var block = new Block(i, j);
        var bb = block.getBoundingBox();
        var piece = {
            width: bb.maxx - bb.minx + 1,
            height: bb.maxy - bb.miny + 1,
            offset: bb.minx
        };
        var orientation = [];
        for (var y = 0; y < piece.height; y++) {
            orientation.push("");
            for (var x = 0; x < piece.width; x++) {
                orientation[y] += "0";
            }
        }
        for (k in Block.blockData[i][j]) {
            var x = Block.blockData[i][j][k][0] - bb.minx;
            var y = Block.blockData[i][j][k][1] - bb.miny;
            orientation[y] = orientation[y].substr(0, x) + "1" + orientation[y].substr(x + 1);
        }
        for (var y = 0; y < piece.height; y++) {
            orientation[y] = parse(orientation[y]);
        }
        piece.orientation = orientation.reverse();
        PIECES[i].push(piece);
    }
}

function parse(x) {
  return parseInt(x.split("").reverse().join(""), 2);
}
