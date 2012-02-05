function Player(target) {
	Board.call(this, target);
	this.reset();
	
	var self = this;
	
	this.dropTimer = new Timer(Player.DROP_DELAY);
	this.dropTimer.on(Timer.EVENT_TIMER, function() { self.drop(); });
	
	this.newBlockTimer = new Timer(Player.NEWBLOCK_DELAY, 1);
	this.newBlockTimer.on(Timer.EVENT_TIMER, function() { self.doCreateNewBlock(); });
	
	this.flipTimer = new Timer(Player.TIME_FLIP, 1);
	this.flipTimer.on(Timer.EVENT_TIMER, function() { self.flip = false; });
	
	this.invisibleTimer = new Timer(Player.TIME_INVISIBLE, 1);
	this.invisibleTimer.on(Timer.EVENT_TIMER, function() { self.invisible = false; });
	
	this.reflectTimer = new Timer(Player.TIME_REFLECT, 1);
	this.reflectTimer.on(Timer.EVENT_TIMER, function() { self.reflect = false; });
	
	this.speedTimer = new Timer(Player.TIME_SPEED, 1);
	this.speedTimer.on(Timer.EVENT_TIMER, function() { self.speed = false; });
}
// Extend Board
Bw.extend(Player, Board);

Player.TIME_FLIP = 10000;
Player.TIME_INVISIBLE = 10000;
Player.TIME_REFLECT = 10000;
Player.TIME_SPEED = 15000;

Player.INVENTORY_MAX = 18;
Player.DROP_DELAY = 1000;
Player.NEWBLOCK_DELAY = 150;

Player.EVENT_GAMEOVER = "gameover";
Player.EVENT_INVENTORY = "inventory";
Player.EVENT_NEW_BLOCK = "new_block";

Player.BLOCK_GENERATOR_RANDOM = 0;
Player.BLOCK_GENERATOR_7BAG = 1;

Player.prototype.reset = function(seed) {
	this.currentBlock = null;
	this.nextBlocks = [];
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
}

Player.prototype.setOptions = function(options) {
	this.options = options;
	this.newBlockTimer.delay = options.entrydelay;
}

Player.prototype.start = function(seed) {
	this.reset(seed);
	this.clear();
	this.isPlaying = true;
	
	// clear rickrolls
	$('body').removeClass('rickroll-1 rickroll-2 rickroll-3');
	
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
	if(this.ghostBlock && this.ghostBlock.hasPieceAt(x,y) && Settings.misc.ghost_block)
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
	
	if(!this.options.specials)
		return;
	
	var i, l;
	for(i=0; i<data.length; ++i) {
		// add removed specials to inventory
		if(typeof data[i] === 'string') {
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
	while(b.length && l) {
		i = Math.floor(b.length * Math.random());
		this.data[b[i]] = Special.getRandomSpecial();
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
Player.prototype.generateBlocks = function() {
	while(this.nextBlocks.length < 3) {
		if(this.options.generator === Player.BLOCK_GENERATOR_RANDOM) {
			this.nextBlocks.push(new Block(this.random.uint32(), 0));
		} else {
			var i, blocks = [];
			for(i = 0; i < Block.blockData.length; ++i)
				blocks.push(i);
			while(blocks.length)
				this.nextBlocks.push(new Block(blocks.splice(this.random.uint32() % blocks.length, 1)[0], 0));
		}
	}
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
	this.generateBlocks();
	this.currentBlock = this.nextBlocks.shift();
	this.currentBlock.x = Math.floor(this.width / 2) - 1;
	this.currentBlock.y = -this.currentBlock.getBoundingBox().miny;
	this.emit(Board.EVENT_UPDATE);
	if (this.collide(this.currentBlock)) {
		this.putBlock(this.currentBlock);
		this.currentBlock = null;
		this.isPlaying = false;
		this.emit(Board.EVENT_CHANGE);
		this.emit(Player.EVENT_GAMEOVER);
	} else {
		this.initDrop();
	}
	this.emit(Player.EVENT_NEW_BLOCK);
}

Player.prototype.move = function(x,y,r,stick) {
	if(!this.currentBlock)
		return;
	if(this.flip)
		x *= -1;
	this.currentBlock.x += x;
	this.currentBlock.y += y;
	var verticalDisplacement = 0;
	if (r) {
		this.currentBlock.rotate(r);
		// make sure the block is never invisible
		while (this.currentBlock.y + (this.currentBlock.getBoundingBox()).maxy < 0) {
			this.currentBlock.y++;
			verticalDisplacement++;
		}
	}
	var c = this.collide(this.currentBlock);
	if(c) {
		if(c == -1 && x == 0 && y == 0 && r && !stick) {
			var bb = this.currentBlock.getBoundingBox(),
				ox = this.currentBlock.x,
				oy = this.currentBlock.y;
			// collided with wall when rotating?
			this.currentBlock.x = (this.currentBlock.x < (this.width/2)) ? -bb.minx : this.width - bb.maxx - 1;
			if (this.collide(this.currentBlock)) {
				this.currentBlock.x = ox;
			} else {
				this.emit(Board.EVENT_UPDATE);
				return false; // no collision
			}
			// collided with floor when rotating?
			for (var i = 0; i < Math.abs(bb.maxy - bb.miny) && this.collide(this.currentBlock); i++) {
				this.currentBlock.y--;
			}
			if (this.collide(this.currentBlock)) {
				this.currentBlock.y = oy;
			} else {
				this.emit(Board.EVENT_UPDATE);
				return false; // no collision
			}
		}
		if (c == 1 && x == 0 && y == 0 && r && !stick) {
			var bb = this.currentBlock.getBoundingBox(),
				oy = this.currentBlock.y;
			// collided with floor when rotating?
			for (var i = 0; i < Math.abs(bb.maxy - bb.miny) && this.collide(this.currentBlock); i++) {
				this.currentBlock.y--;
			}
			if (this.collide(this.currentBlock)) {
				this.currentBlock.y = oy;
			} else {
				this.emit(Board.EVENT_UPDATE);
				return false; // no collision
			}
		}
		// revert position
		this.currentBlock.x -= x;
		this.currentBlock.y -= (y + verticalDisplacement);
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
	if(this.nextBlocks && this.nextBlocks.length) {
		if(!this.target)
			return;
		
		var nextBlock = this.nextBlocks[0];
		var x, y, b;
		var bp = {};
		for(x = 0; x < nextBlock.data.length; ++x)
			bp[nextBlock.data[x][0]+'_'+nextBlock.data[x][1]] = nextBlock.type + 1;
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
		html += '<div class="cell '+(b !== 0 ? (typeof b === 'string' ? 'special special-'+b : 'block block-'+b) : 'empty')+'"> </div>';
	}
	html += '</div>';
	if(this.inventory.length)
		html += "<p>" + Special.getSpecial(this.inventory[0]).name + "</p>";
	this.target.find('.inventory').html(html);
}

Player.prototype.use = function(msg) {
	var special = Special.getSpecial(msg.s);
	var change = special.apply(this, msg);
	this.checklines(false);
	if(change) {
		this.moveUpIfBlocked();
		this.emit(Board.EVENT_CHANGE);
	}
}

Object.freeze(Board.prototype);
Object.freeze(Player.prototype);
Object.freeze(Player);
