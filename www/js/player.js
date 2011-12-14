function Player(target) {
	Board.call(this, target);
	this.reset();
	
	var self = this;
	
	this.dropTimer = new Timer(1000);
	this.dropTimer.on(Timer.EVENT_TIMER, function() { self.drop(); });
	this.newBlockTimer = new Timer(Player.DROP_DELAY, 1);
	this.newBlockTimer.on(Timer.EVENT_TIMER, function() { self.doCreateNewBlock(); });
	
	this.flipTimer = new Timer(10000, 1);
	this.flipTimer.on(Timer.EVENT_TIMER, function() { self.flip = false; });
	
	this.invisibleTimer = new Timer(10000, 1);
	this.invisibleTimer.on(Timer.EVENT_TIMER, function() { self.invisible = false; });
	
	this.reflectTimer = new Timer(10000, 1);
	this.reflectTimer.on(Timer.EVENT_TIMER, function() { self.reflect = false; });
	
	this.speedTimer = new Timer(15000, 1);
	this.speedTimer.on(Timer.EVENT_TIMER, function() { self.speed = false; });
	
	this.sTimer = new Timer(15000, 1);
	this.sTimer.on(Timer.EVENT_TIMER, function() { self.sBlocks = false; });
}
// Extend Board
Bw.extend(Player, Board);
Player.EVENT_GAMEOVER = "gameover";
Player.EVENT_INVENTORY = "inventory";

Player.SPECIAL_ADD_LINE = -1;
Player.SPECIAL_CLEAR_LINE = -2;
Player.SPECIAL_NUKE = -3;
Player.SPECIAL_QUAKE = -4;
Player.SPECIAL_CLEAR_RANDOM = -5;
Player.SPECIAL_CLEAR_SPECIALS = -6;
Player.SPECIAL_GRAVITY = -7;
Player.SPECIAL_BOMB = -8;
Player.SPECIAL_SWITCH = -9;
Player.SPECIAL_LGRAVITY = -10;
Player.SPECIAL_ZEBRA = -11;
Player.SPECIAL_FLIP = -12;
Player.SPECIAL_INVISIBLE = -13;
Player.SPECIAL_REFLECT = -14;
Player.SPECIAL_GAMEOFLIFE = -15;
Player.SPECIAL_GLUE = -16;
Player.SPECIAL_RICKROLL = -17;
Player.SPECIAL_MOSES = -18;
Player.SPECIAL_INVERT = -19;
Player.SPECIAL_SPEED = -20;
Player.SPECIAL_RANDOM = -21;
Player.SPECIAL_SBLOCKS = -22;
Player.NUM_SPECIALS = 21;
Player.INVENTORY_MAX = 18;
Player.DROP_DELAY = 150;

Player.special = {
	'-1': {
		name: "Add line",
		occurancy: 16
	},
	'-2': {
		name: "Clear line",
		occurancy: 13
	},
	'-3': {
		name: "Nuke field",
		occurancy: 1
	},
	'-4': {
		name: "Blockquake",
		occurancy: 10
	},
	'-5': {
		name: "Clear random",
		occurancy: 12
	},
	'-6': {
		name: "Clear specials",
		occurancy: 12
	},
	'-7': {
		name: "Gravity",
		occurancy: 5
	},
	'-8': {
		name: "Bomb",
		occurancy: 12
	},
	'-9': {
		name: "Switch",
		occurancy: 3
	},
	'-10': {
		name: "Left Gravity",
		occurancy: 4
	},
	'-11': {
		name: "Zebra field",
		occurancy: 1
	},
	'-12': {
		name: "Flip",
		occurancy: 6
	},
	'-13': {
		name: "Invisible",
		occurancy: 5
	},
	'-14': {
		name: "Reflect",
		occurancy: 5
	},
	'-15': {
		name: "Game of Life",
		occurancy: 2
	},
	'-16': {
		name: "Glue piece",
		occurancy: 2
	},
	'-17': {
		name: "Rickroll",
		occurancy: 6
	},
	'-18': {
		name: "Moses",
		occurancy: 2
	},
	'-19': {
		name: "Invert field",
		occurancy: 2
	},
	'-20': {
		name: "Speed",
		occurancy: 4
	},
	'-21': {
		name: "Surprise",
		occurancy: 3
	},
	'-22': {
		name: "S-blocks",
		occurancy: 6
	}
};

Player.prototype.reset = function(seed) {
	this.currentBlock = null;
	this.nextBlock = null;
	this.ghostBlock = null;
	this.numLines = 0;
	this.numBlocks = 0;
	
	this.dropStick = 0;
	this.random = seed ? prng(seed) : prng();
	this.inventory = [];
	this.zebra = false;
	this.flip = false;
	this.reflect = false;
	this.invisible = false;
	this.speed = false;
	this.isPlaying = false;
	this.rickroll = 0;
	this.nukeTimer = null;
	this.specials = true;
	this.sBlocks = false;
}

Player.prototype.start = function(seed) {
	this.reset(seed);
	this.clear();
	this.isPlaying = true;
	
	// clear rickrolls
	$('body').removeClass('rickroll-1 rickroll-2 rickroll-3');
	
	this.totalOccurancy = 0;
	for(var s in Player.special)
		this.totalOccurancy += Player.special[s].occurancy;
		
	this.createNewBlock();
	
	this.emit(Board.EVENT_CHANGE);
	this.emit(Board.EVENT_INVENTORY);
}

Player.prototype.stop = function() {
	this.dropTimer.stop();
	this.newBlockTimer.stop();
	this.emit(Board.EVENT_UPDATE);
}

// override at-function
Player.prototype.at = function(x,y) {
	if(this.currentBlock && this.currentBlock.hasPieceAt(x,y))
		return this.currentBlock.type + 1;
	if(this.ghostBlock && this.ghostBlock.hasPieceAt(x,y))
		return 10;
	if(this.invisible) {
		if(this.currentBlock) {
			var bx, by;
			for(var i = 0; i < this.currentBlock.data.length; ++i) {
				bx = this.currentBlock.x + this.currentBlock.data[i][0];
				by = this.currentBlock.y + this.currentBlock.data[i][1];
				if(Math.abs(x-bx) <= 4 && Math.abs(y-by) <= 4)
					return this.data[y * this.width + x];
			}
		}
		return 9;
	}
	return this.data[y * this.width + x];
}

// override addLines-function
Player.prototype.addLines = function(numLines) {
	Board.prototype.addLines.call(this, numLines);
	if(this.currentBlock)
		this.currentBlock.y = Math.max(0, this.currentBlock.y - numLines);
	this.emit(Board.EVENT_CHANGE);
}

Player.prototype.onRemoveLines = function(lines, data) {
	this.numLines += lines;
	Board.prototype.onRemoveLines.call(this, lines, data);
	
	if(!this.specials)
		return;
	
	var i, l;
	for(i=0; i<data.length; ++i) {
		// add removed specials to inventory
		if(data[i] < 0) {
			for(l = 0; l < lines && this.inventory.length < Player.INVENTORY_MAX; ++l) {
				var p = this.inventory.length == 0 ? 0 : 1 + Math.floor((this.inventory.length - 1) * Math.random());
				this.inventory.splice(p, 0, data[i]);
			}
		}
	}
	
	// attempt to add new specials
	var b = []; // b contains occupied blocks
	for(i = 0; i < this.data.length; ++i) {
		if(this.data[i] > 0)
			b.push(i);
	}
	
	l = lines;
	var special, occurancy;
	while(b.length && l) {
		i = Math.floor(b.length * Math.random());
		occurancy = Math.floor(this.totalOccurancy * Math.random());
		for(var ss in Player.special) {
			occurancy -= Player.special[ss].occurancy;
			special = parseInt(ss);
			if(occurancy < 0)
				break;
		}
		this.data[b[i]] = special;
		b.splice(i,1);
		l--;
	}
	
	this.emit(Board.EVENT_INVENTORY);
}

Player.prototype.drop = function() {
	if(this.move(0,1,0,this.dropStick == 5))
		++this.dropStick;
}
Player.prototype.initDrop = function() {
	if(!this.speed)
		this.dropTimer.delay = Math.max(50, 750 - this.numLines * 5);
	this.dropTimer.start();
}
Player.prototype.getRandomBlock = function() {
	var rndType = this.random.uint32();
	var rndRot = this.random.uint32();
	if(this.sBlocks)
		return new Block(rndType % 2 ? 5 : 6, rndRot);
	return new Block(rndType, rndRot);
}

Player.prototype.createNewBlock = function() {
	this.currentBlock = null;
	this.emit(Board.EVENT_CHANGE);
	
	this.dropTimer.stop();
	this.newBlockTimer.start();
}

Player.prototype.doCreateNewBlock = function() {
	this.numBlocks++;
	this.dropStick = 0;
	this.currentBlock = this.nextBlock ? this.nextBlock : this.getRandomBlock();
	this.nextBlock = this.getRandomBlock();
	this.currentBlock.x = Math.floor(this.width / 2) - 1;
	this.emit(Board.EVENT_UPDATE);
	if(this.collide(this.currentBlock)) {
		this.putBlock(this.currentBlock);
		this.currentBlock = null;
		this.isPlaying = false;
		this.emit(Board.EVENT_CHANGE);
		this.emit(Player.EVENT_GAMEOVER);
	} else
		this.initDrop();
}

Player.prototype.move = function(x,y,r,stick) {
	if(!this.currentBlock)
		return;
	if(this.flip)
		x *= -1;
	this.currentBlock.x += x;
	this.currentBlock.y += y;
	if(r)
		this.currentBlock.rotate(r);
	var c = this.collide(this.currentBlock);
	if(c) {
		if(c == -1 && x == 0 && y == 0 && r && !stick) {
			// collided with wall when rotating?
			var bb = this.currentBlock.getBoundingBox(),
				ox = this.currentBlock.x;
			this.currentBlock.x = (this.currentBlock.x < (this.width/2)) ? -bb.minx : this.width - bb.maxx - 1;
			if(this.collide(this.currentBlock))
				this.currentBlock.x = ox;
			else {
				this.emit(Board.EVENT_UPDATE);
				return false; // no collision
			}
		}
		// revert position
		this.currentBlock.x -= x;
		this.currentBlock.y -= y;
		if(r)
			this.currentBlock.rotate(-r);
		if(stick) {
			this.putBlock(this.currentBlock);
			this.createNewBlock();
		}
		return true;
	}
	this.emit(Board.EVENT_UPDATE);
	return false;
}

Player.prototype.falldown = function(put) {
	if(!this.currentBlock)
		return;
	while(!this.collide(this.currentBlock))
		++this.currentBlock.y;
	
	// revert position
	--this.currentBlock.y;
	if(put) {
		this.putBlock(this.currentBlock);
		this.createNewBlock();
	} else {
		this.emit(Board.EVENT_UPDATE);
	}
}

Player.prototype.moveUpIfBlocked = function() {
	if(!this.currentBlock)
		return;
	while(this.collide(this.currentBlock)) {
		if(this.currentBlock.y <= 0) {
			this.putBlock(this.currentBlock);
			this.createNewBlock();
			break;
		}
		--this.currentBlock.y;
	}
}

Player.prototype.render = function() {
	// update ghost block
	this.ghostBlock = null;
	if(this.currentBlock) {
		this.ghostBlock = new Block(0,0);
		for(var key in this.currentBlock)
			this.ghostBlock[key] = this.currentBlock[key];
		while(!this.collide(this.ghostBlock))
			++this.ghostBlock.y;
		--this.ghostBlock.y;
	}
	
	Board.prototype.render.call(this);
	var html = '';
	if(this.nextBlock) {
		if(!this.target)
			return;
		
		var x, y, b;
		var bp = {};
		for(x = 0; x < this.nextBlock.data.length; ++x)
			bp[this.nextBlock.data[x][0]+'_'+this.nextBlock.data[x][1]] = this.nextBlock.type + 1;
		for(y = 0; y < 4; ++y) {
			html += '<div class="row">';
			for(x = 0; x < 4; ++x) {
				b = bp[x+'_'+y];
				html += '<div class="cell '+(b ? 'block block-'+b : 'empty')+'"> </div>';
			}
			html += '</div>';
		}
		this.target.find('.nextpiece').html('<div>'+html+'</div>');
	}
}

Player.prototype.renderInventory = function() {
	var html = '<div class="row">';
	for(var i = 0; this.inventory && i < this.inventory.length; ++i) {
		var b = this.inventory[i];
		html += '<div class="cell '+(b ? (b < 0 ? 'special special-'+(-b) : 'block block-'+b) : 'empty')+'"> </div>';
	}
	html += '</div>';
	if(this.inventory.length)
		html += "<p>" + Player.special[this.inventory[0]].name + "</p>";
	this.target.find('.inventory').html(html);
}

Player.prototype.use = function(msg) {
	var change = false;
	switch(msg.s) {
		case Player.SPECIAL_ADD_LINE:
			this.addLines(1);
			change = true;
			break;
			
		case Player.SPECIAL_CLEAR_LINE:
			this.data.splice((this.height - 1) * this.width, this.width);
			for(var x=0; x < this.width; ++x)
				this.data.unshift(0);
			change = true;
			break;
			
		case Player.SPECIAL_NUKE:
			for(var i = 0; i < this.width * this.height; ++i)
				this.data[i] = 0;
			change = true;
			
			var $board = this.target.find('.board');
			var $boardWrapper = $board.find('.board-wrapper');
			var xpos = Math.round((480 - $boardWrapper.width()) * 0.5)-20;
			$board.addClass('nuke');
			$board.css({
				'background': "black -"+xpos+"px bottom no-repeat url('../images/nuke.gif?" + Math.floor(Math.random()*1000000000) + "')"
			});
			clearTimeout(this.nukeTimer);
			this.nukeTimer = setTimeout(function(obj) {
				obj.removeClass('nuke');
				obj.css({
					'background': 'transparent'
				});
			}, 2000, $board);
			
			break;
			
		case Player.SPECIAL_QUAKE:
			for(var i = 0; i < this.height; ++i) {
				var amount = 0;
				var r = Math.floor(Math.random() * 22);
				if(r < 1)
					++amount;
				if(r < 4)
					++amount;
				if(r < 11)
					++amount;
				if(!amount)
					continue;
				if(Math.random() < 0.5)
					amount = -amount;
				var l = this.data.splice(i*this.width, this.width);
				for(var x = 0; x < this.width; ++x)
					this.data.splice(i*this.width+x, 0, l[(x+amount) % this.width]);
			}
			change = true;
			var board = this.target.find('.board');
			var shakeCenter = this.target.css('margin-left');
			var shakeFunction = function(count){
				if (count) {
					board.css({
						'margin-left': (Math.random()-0.5)*50,
						'-webkit-transform': 'rotate(' + (Math.random()-0.5)*30 + 'deg)'
					});
					setTimeout(shakeFunction, 25, --count);
				}
				else {
					board.css({
						'margin-left': 0,
						'-webkit-transform': 'rotate(0deg)'
					});
				}
			};
			shakeFunction(20);
			
			break;
			
		case Player.SPECIAL_CLEAR_RANDOM:
			for(var i = 0; i < 10; ++i)
				this.data[Math.floor(Math.random()*this.data.length)] = 0;
			change = true;
			break;
			
		case Player.SPECIAL_CLEAR_SPECIALS:
			for(var i = 0; i < this.data.length; ++i) {
				if(this.data[i] < 0) {
					this.data[i] = 1 + Math.floor(Math.random() * Block.blockData.length);
					change = true;
				}
			}
			break;
			
		case Player.SPECIAL_GRAVITY:
			for(var x = 0; x < this.width; ++x) {
				var py = this.height - 1;
				for(var y = this.height - 1; y >= 0; --y) {
					if(this.data[y * this.width + x]) {
						this.data[py * this.width + x] = this.data[y * this.width + x]
						--py;
					}
				}
				while(py >= 0)
					this.data[py-- * this.width + x] = 0;
			}
			change = true;
			break;
			
		case Player.SPECIAL_BOMB:
			for(var y = 0; y < this.height; ++y) {
				for(var x = 0; x < this.width; ++x) {
					if(this.data[y*this.width + x] == Player.SPECIAL_BOMB) {
						
						// BOOOM!
						var cell = this.target.find('.board-wrapper .row').eq(y).children().eq(x);
						if(cell.length) {
							var explosion = $('<div class="explosion" />');
							explosion.css({ 'top': cell.offset().top, 'left': cell.offset().left,
								'background-image': "url('../images/explosion.gif?" + Math.floor(Math.random()*1000000000) + "')" });
							$('#container').append(explosion);
							setTimeout(function(obj){ obj.remove(); }, 2000, explosion);
						}
						
						this.data[y*this.width + x] = 0;
						var around = [];
						for(var yy = y-1; yy <= y+1; ++yy) {
							for(var xx = x-1; xx <= x+1; ++xx) {
								if(xx < 0 || xx >= this.width || yy < 0 || yy >= this.height || (xx == x && yy == y))
									continue;
								var d = this.data[yy*this.width + xx];
								if(d == Player.SPECIAL_BOMB)
									around.push(0);
								else {
									around.push(d);
									this.data[yy*this.width + xx] = 0;
								}
							}
						}
						for(var i = 0; i < around.length; ++i) {
							var yy = 6 + Math.floor(Math.random() * (this.height - 6));
							var xx = Math.floor(Math.random() * this.width);
							this.data[yy*this.width + xx] = around[i];
						}
						change = true;
					}
				}
			}
			break;
			
		case Player.SPECIAL_SWITCH:
			if(msg.data) {
				this.data = msg.data;
				for(var y = 0; y < 5; ++y) {
					for(var x = 0; x < this.width; ++x) {
						this.data[y * this.width + x] = 0;
					}
				}
				change = true;
			}
			break;
			
		case Player.SPECIAL_LGRAVITY:
			for(var y = 0; y < this.height; ++y) {
				var px = 0;
				for(var x = 0; x < this.width; ++x) {
					if(this.data[y * this.width + x]) {
						this.data[y * this.width + px] = this.data[y * this.width + x]
						++px;
					}
				}
				while(px < this.width)
					this.data[y * this.width + px++] = 0;
			}
			change = true;
			break;
			
		case Player.SPECIAL_ZEBRA:
			for(var y = 0; y < this.height; ++y) {
				for(var x = (this.zebra ? 1 : 0); x < this.width; x += 2) {
					this.data[y * this.width + x] = 0;
				}
			}
			this.zebra = !this.zebra;
			change = true;
			break;
			
		case Player.SPECIAL_FLIP:
			this.flip = !this.flip;
			this.flipTimer.start();
			break;
			
		case Player.SPECIAL_INVISIBLE:
			this.invisible = true;
			if(this.invisibleTimer.isRunning())
				this.invisibleTimer.delay = 10000 + Math.max(0, this.invisibleTimer.delay - this.invisibleTimer.time());
			else
				this.invisibleTimer.delay = 10000;
			console.log('invis timer at ', this.invisibleTimer.delay);
			this.invisibleTimer.start();
			change = true;
			break;
			
		case Player.SPECIAL_REFLECT:
			this.reflect = true;
			this.reflectTimer.start();
			break;
			
		case Player.SPECIAL_GAMEOFLIFE:
			var d = [];
			change = true;
			for(var y = 0; y < this.height; ++y) {
				for(var x = 0; x < this.width; ++x) {
					var around = 0;
					for(var yy = y-1; yy <= y+1; ++yy) {
						for(var xx = x-1; xx <= x+1; ++xx) {
							if(xx < 0 || xx >= this.width || yy < 0 || yy >= this.height || (xx == x && yy == y))
								continue;
							if(this.data[yy*this.width + xx])
								++around;
						}
					}
					var alive = this.data[y*this.width + x];
					if(alive) {
						if(around < 2 || around > 3)
							alive = 0;
					} else {
						if(around == 3)
							alive = 1 + Math.floor(Math.random() * Block.blockData.length);
					}
					d.push(alive);
				}
			}
			this.data = d;
			break;
			
		case Player.SPECIAL_GLUE:
			if(this.currentBlock) {
				if(this.currentBlock.y >= 6) {
					this.putBlock(this.currentBlock);
					this.createNewBlock();
				} else {
					this.falldown(true);
				}
			}
			break;
			
		case Player.SPECIAL_RICKROLL:
			var player = this;
			$('body').addClass('rickroll-' + (++this.rickroll));
			setTimeout(function() {
				$('body').removeClass('rickroll-' + (player.rickroll--));
			}, 10000);
			break;
			
		case Player.SPECIAL_MOSES:
			for(var y = 0; y < this.height; ++y) {
				var i = 0;
				for(var x = 0; x < this.width; ++x) {
					if (this.data[y * this.width + x])
						++i;
				}
				var newRow = [];
				var px = 0;
				for(var x = 0; x < this.width; ++x) {
					if (this.data[y * this.width + x]) {
						if (px < i*0.5)
							newRow[px] = this.data[y * this.width + x]
						else
							newRow[this.width - i + px] = this.data[y * this.width + x]
						++px;
					}
				}
				for (var x = 0; x < this.width; ++x)
					this.data[y * this.width + x] = newRow[x];
			}
			change = true;
			break;
			
		case Player.SPECIAL_INVERT:
			var inv = false;
			for(var y = this.height-1; y >= 0; --y) {
				if(!inv) {
					for(var x = 0; x < this.width; ++x) {
						if(this.data[y * this.width + x])
							inv = true;
					}
				}
				if(inv && y >= 6) {
					for(var x = 0; x < this.width; ++x) {
						this.data[y * this.width + x] = this.data[y * this.width + x] ? 0 : 1 + Math.floor(Math.random() * Block.blockData.length);
					}
				}
			}
			change = true;
			break;
			
		case Player.SPECIAL_SPEED:
			var maxHeight = 0;
			for(var y = this.height-1; y >= 0; --y) {
				for(var x = 0; x < this.width; ++x) {
					if(this.data[y * this.width + x]) {
						maxHeight = this.height - y;
						break;
					}
				}
			}
			console.log(maxHeight);
			this.speed = true;
			this.dropTimer.delay = 50 + maxHeight * 6;
			this.dropTimer.start();
			this.speedTimer.start();
			break;
			
		case Player.SPECIAL_RANDOM:
			var m = {};
			m.s = -(1 + Math.floor(Math.random() * Player.NUM_SPECIALS));
			this.use(m);
			break;
			
		case Player.SPECIAL_SBLOCKS:
			this.sBlocks = true;
			if(this.sTimer.isRunning())
				this.sTimer.delay = 10000 + Math.max(0, this.sTimer.delay - this.invisibleTimer.time());
			else
				this.sTimer.delay = 10000;
			this.sTimer.start();
			break;
			
		default:
			console.log('Special not supported');
	}
	this.checklines(false);
	if(change) {
		this.moveUpIfBlocked();
		this.emit(Board.EVENT_CHANGE);
	}
}
Object.freeze(Board.prototype);
Bw.recursiveFreeze(Player.special);
Object.freeze(Player.prototype);
Object.freeze(Player);
