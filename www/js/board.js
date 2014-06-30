function Board() {
	this.width = 12;
	this.height = 24 + Board.VANISH_ZONE_HEIGHT;
	this.data = [];
	this.currentBlock = null;
	this.clear();
}

Bw.extend(Board, Bw.EventEmitter);

Board.VANISH_ZONE_HEIGHT = 4

Board.EVENT_UPDATE = "update";
Board.EVENT_CHANGE = "change";
Board.EVENT_LINES = "lines";
Board.EVENT_REMOVE_LINE = "remove line";
Board.PUT_BLOCK = "putblock";

Board.NO_COLLISION = 0;
Board.COLLISION_BLOCKS = 1;
Board.COLLISION_BOUNDS = 2;

Board.prototype.setSize = function(w, h) {
	this.width = w;
	this.height = h + Board.VANISH_ZONE_HEIGHT;
	this.data = [];
	this.clear();
}

Board.prototype.clear = function() {
	for(var i = 0; i < this.width * this.height; ++i)
		this.data[i] = 0;
}

Board.prototype.at = function(x,y) {
	if(this.currentBlock && this.currentBlock.hasPieceAt(x,y))
		return this.currentBlock.type + 1;
	return this.data[y * this.width + x];
}

Board.prototype.checklines = function(action) {
	var l = 0, t, x, y, removed = [];
	for(y = this.height - 1; y >= 0; --y) {
		t = true;
		for(x = 0; x < this.width; ++x)
			t = t && this.data[y * this.width + x];
		if (t) {
			this.emit(Board.EVENT_REMOVE_LINE, y - l);
			removed = removed.concat(this.data.splice(y * this.width, this.width));
			for(x=0; x < this.width; ++x) // add empty line to the top
				this.data.unshift(0);
			++l;
			++y;
		}
	}
	if (action)
		this.onRemoveLines(l, removed);
}

Board.prototype.onRemoveLines = function(lines, removed) {
	this.emit(Board.EVENT_LINES, lines);
}

Board.prototype.addLines = function(numLines) {
	this.data.splice(0, numLines * this.width);
	for(var y=0; y < numLines; ++y) {
		var empty = Math.floor(Math.random() * this.width);
		for(var x=0; x < this.width; ++x)
			this.data.push( x == empty ? 0 : 1 + Math.floor(Math.random() * Block.blockData.length) );
	}
}

Board.prototype.putBlock = function(block) {
	var i, x, y;
	for(i = 0; i < block.data.length; ++i) {
		x = block.x + block.data[i][0];
		y = block.y + block.data[i][1];
		if (y >= 0)
			this.data[y * this.width + x] = block.type + 1;
	}
	this.emit(Board.PUT_BLOCK);
	this.checklines(true);
}

Board.prototype.collide = function(block) {
	// check bounds
	var i, bx, by;
	for(i = 0; i < block.data.length; ++i) {
		bx = block.x + block.data[i][0];
		by = block.y + block.data[i][1];
		if(bx < 0 || bx >= this.width || by >= this.height)
			return Board.COLLISION_BOUNDS;
	}
	// check collision
	for(i = 0; i < block.data.length; ++i) {
		bx = block.x + block.data[i][0];
		by = block.y + block.data[i][1];
		if(this.data[by * this.width + bx])
			return Board.COLLISION_BLOCKS;
	}
	return Board.NO_COLLISION;
}
