function PlayerView(player) {
	this.player = player;
	this.isPlayer = (this.player instanceof Player);
	this.notifierSlots = [];
	this.nukeTimer = 0;

	this.el = $(
		'<div class="player">'+
			'<h2>Player</h2>'+
			'<div class="board"></div>'+
			'<div class="nextpiece"></div>'+
			'<div class="holdpiece"></div>'+
			'<div class="inventory"></div>'+
		'</div>').appendTo('#gamearea');
		
	this.render();
	
	var self = this;
	this.player.on(Board.EVENT_UPDATE, function() {
		self.render();
	});
	this.player.on(Board.EVENT_CHANGE, function() {
		self.render();
	});
	this.player.on(Player.EVENT_INVENTORY, function() {
		self.renderInventory();
	});
	this.player.on(Board.EVENT_REMOVE_LINE, function(y) {
		self.removeLine(y);
	});
	this.player.on(Player.EVENT_SPECIAL, function(msg) {
		switch(msg.s) {
			case Special.NUKE: self.specialNuke(); break;
			case Special.QUAKE: self.specialQuake(); break;
			case Special.BOMB: self.specialBomb(); break;
			case Special.MOSES: self.specialMoses(); break;
			case Special.ZEBRA: self.specialZebra(); break;
			case Special.CLEAR_SPECIALS: self.specialClearSpecials(); break;
			case Special.INVENTORY_BOMB: self.specialInventoryBomb(); break;
		}
	});
	this.player.on(Player.EVENT_NOTIFY, function(msg) {
		var offset = 0;
		var $msg = $(msg);
		for (var i = 0; self.notifierSlots[i]; i++, offset++) ;
		self.notifierSlots[offset] = true;
		$msg.data('offset', offset);
		$msg.css('top', offset * 50);
		setTimeout(function(obj){
			obj.animate({'opacity':0}, 500, function(){
				self.notifierSlots[obj.data('offset')] = false;
				obj.remove();
			});
		}, 2000, $msg);
		self.el.append($msg);
	});
}

PlayerView.shakeObject = function(obj, count, delay, width, height, defaultMargin, callback) {
	var args = {
		obj: obj,
		count: count,
		countStart: count,
		delay: delay,
		width: width,
		height: height,
		defaultMargin: defaultMargin,
		callback: callback
	};
	var shake = function(args) {
		if (args.count--) {
			var factor = (args.count+1) / args.countStart;
			var horizontal = Math.round(Math.random()*(args.count&1?-1:1)*args.width*factor);
			var vertical = Math.round((Math.random()-0.5)*args.height*factor);
			args.obj.css({
				'margin-left': horizontal,
				'margin-right': -horizontal,
				'margin-top': vertical,
				'margin-bottom': -vertical
			});
			setTimeout(shake, args.delay, args);
		}
		else {
			console.log(args.obj);
			args.obj.css('margin', args.defaultMargin);
			if (typeof args.callback === 'function')
				(args.callback).call(args.obj);
		}
	};
	shake(args);
}

PlayerView.prototype.render = function() {
	var html = '';
	var x, y, b;
	
	// update ghost block
	if(this.isPlayer)
		this.player.updateGhostBlock();
		
	// update board
	var toprow = '';
	if(this.isPlayer) {
		toprow += '<div class="row">';
		for(x = 0; x < this.player.width; ++x) {
			b = this.player.at(x,Board.VANISH_ZONE_HEIGHT-1);
			toprow += '<div class="cell '+(b !== 0 ? (typeof b === 'string' ? 'special special-'+b : 'block block-'+b) : 'empty')+'"> </div>';
		}
		toprow += '</div>';
	}
	for(y = Board.VANISH_ZONE_HEIGHT; y < this.player.height; ++y) {
		html += '<div class="row">';
		for(x = 0; x < this.player.width; ++x) {
			b = this.player.at(x,y);
			html += '<div class="cell '+(b !== 0 ? (typeof b === 'string' ? 'special special-'+b : 'block block-'+b) : 'empty')+'"> </div>';
		}
		html += '</div>';
	}
	this.el.find('.board').html('<div class="toprow-wrapper">'+toprow+'</div><div class="board-wrapper">'+html+'</div>');
	
	if(!this.isPlayer)
		return;
	
	// update preview (next) blocks
	if(this.player.nextBlocks && this.player.nextBlocks.length) {
		html = '';
		for(var i = 0; i < this.player.options.nextpiece; i++) {
			var bp = {};
			var nextBlock = this.player.nextBlocks[i];
			for(x = 0; x < nextBlock.data.length; ++x)
				bp[nextBlock.data[x][0]+'_'+nextBlock.data[x][1]] = nextBlock.type + 1;
			for(y = 0; y < 2; ++y) {
				html += '<div class="row">';
				for(x = 0; x < 4; ++x) {
					b = bp[x+'_'+y];
					html += '<div class="cell '+(b ? 'block block-'+(i>0?'8':b) : 'empty')+'"> </div>';
				}
				html += '</div>';
			}
			if (i < this.player.options.nextpiece - 1)
				html += '<div class="row empty"/>';
		}
		this.el.find('.nextpiece').html('<div>'+html+'</div>');
	}
	
	// Update hold block
	if (this.player.holdBlock) {
		html = '';
		var bp = {};
		for(x = 0; x < this.player.holdBlock.data.length; ++x)
			bp[this.player.holdBlock.data[x][0]+'_'+this.player.holdBlock.data[x][1]] = this.player.holdBlock.type + 1;
		for(y = 0; y < 2; ++y) {
			html += '<div class="row">';
			for(x = 0; x < 4; ++x) {
				b = bp[x+'_'+y];
				html += '<div class="cell '+(b ? 'block block-'+b : 'empty')+'"> </div>';
			}
			html += '</div>';
		}
		this.el.find('.holdpiece').html('<div>'+html+'</div>');
	} else {
		this.el.find('.holdpiece').empty();
	}

}

PlayerView.prototype.renderInventory = function() {
	var inv = this.player.inventory;
	var html = '<div class="row">';
	for(var i = 0; inv && i < inv.length; ++i) {
		var b = inv[i];
		html += '<div class="cell '+(b !== 0 ? (typeof b === 'string' ? 'special special-'+b : 'block block-'+b) : 'empty')+'"> </div>';
	}
	html += '</div>';
	if(inv.length)
		html += "<p>" + Special.getSpecial(inv[0]).name + "</p>";
	this.el.find('.inventory').html(html);
}

PlayerView.prototype.removeLine = function(y) {
	var row = y - Board.VANISH_ZONE_HEIGHT;
	if (row > 0) {
		var $original = this.el.find('.board-wrapper .row').eq(row);
		var $clear = $original.clone()
			.appendTo(this.el)
			.css({position: 'absolute'})
			.offset($original.offset())
			.animate({top: '+=20px', opacity: 0}, 250, function() { $clear.remove(); });
	}
}

PlayerView.prototype.specialNuke = function() {
	var $board = this.el.find('.board')
		.addClass('nuke')
		.css({
			background: "black center bottom no-repeat url('../images/nuke.gif?" + Date.now() + "')",
			'background-size': 'cover'
		});
	if (this.nukeTimer)
		clearTimeout(this.nukeTimer);
	this.nukeTimer = setTimeout(function() {
		$board.removeClass('nuke').css('background', 'transparent');
		this.nukeTimer = 0;
	}, 1800); // 60 frames * 0.03 seconds
}

PlayerView.prototype.specialQuake = function() {
	PlayerView.shakeObject(this.el.find('.board'), 20, 50, 30, 30, 0);
}

PlayerView.prototype.specialBomb = function() {
	var self = this;
	this.el.find('.board-wrapper .special-b').each(function() {
		var node = $('<div class="explosion" />')
			.offset($(this).offset())
			.appendTo('#container')
			.css({'background-image': "url('../images/explosion.gif?" + Date.now() + "')"});
		if (!self.isPlayer)
			node.css({'-webkit-transform': 'scale(0.5)'});
		setTimeout(function(obj){ obj.remove(); }, 2000, node);
	});
}

PlayerView.prototype.specialMoses = function() {
	var $rainbow = $('<div class="nyancat-rainbow" />');
	var $nyancat = $('<div class="nyancat" />');
	var centerOffset = this.el.find('.board .row:first').children().eq(Math.floor(this.player.width/2)).offset();
	var boardHeight = this.el.find('.board').height();
	centerOffset.left -= 3;
	$rainbow.appendTo('#container')
		.offset(centerOffset)
		.css({height:0})
		.animate({ height: boardHeight }, 1000, function(){
			$(this).animate({ opacity: 0 }, 1000, function(){ $(this).remove(); });
		});
	$nyancat.appendTo('#container')
		.offset(centerOffset)
		.css({top:centerOffset.top-8})
		.animate({ top: '+='+boardHeight }, 1000, function(){ $(this).remove(); });
	if (!this.isPlayer) {
		centerOffset.left -= 5;
		$nyancat.add($rainbow).offset(centerOffset);
		$nyancat.css({'-webkit-transform': 'scale(0.5)'});
		$rainbow.css({'-webkit-transform': 'scaleX(0.5)'});
	}
}

PlayerView.prototype.specialZebra = function() {
	if (!this.isPlayer)
		this.player.zebra = typeof this.player.zebra === 'undefined' ? false : !this.player.zebra;
	var animationDir = this.player.zebra ? '-' : '+';
	var animationLen = this.isPlayer ? 200 : 100;
	var $rows = this.el.find('.board-wrapper .row');
	for (var x = (this.player.zebra ? 1 : 0), i = 0; x < this.player.width; x += 2, i++) {
		var $column = $('<div class="column"/>');
		for (var y = Board.VANISH_ZONE_HEIGHT; y < this.player.height; y++) {
			var b = this.player.data[y * this.player.width + x];
			if (this.isPlayer && this.player.invisible) {
				if (!this.player.inBlockVisinity(x, y))
					b = 0;
			}
			var $cell = $('<div class="cell"/>');
			$cell.addClass(b !== 0 ? (typeof b === 'string' ? 'special special-'+b : 'block block-'+b) : 'empty');
			$column.append($cell);
		}
		$column.appendTo(this.el)
			.css({position: 'absolute'})
			.offset($rows.first().find('.cell').eq(x).offset());
		setTimeout(function(obj){
			obj.animate({top: animationDir+'='+animationLen+'px', opacity: 0}, 500, function(){ obj.remove(); });
		}, i*50, $column);
	}
}

PlayerView.prototype.specialClearSpecials = function() {
	var self = this;
	this.el.find('.board-wrapper .special').each(function() {
		var node = $('<div class="sparkle" />')
			.offset($(this).offset())
			.appendTo('#container')
			.css({'background-image': "url('../images/sparkle.gif?" + Date.now() + "')"});
		if (!self.isPlayer)
			node.css({'-webkit-transform': 'scale(0.5)'});
		node.fadeOut(4000, function(){ node.remove(); });
	});
}

PlayerView.prototype.specialInventoryBomb = function() {
	var self = this;
	var $inventory = this.el.find('.inventory');
	$inventory.find('.cell').each(function(i, obj){
		var $clone = $(this).clone()
			.appendTo(self.el)
			.css({position: 'absolute'})
			.offset($(this).offset());
		PlayerView.shakeObject($clone, 30, 50, 10, 5, 0, function(){ this.fadeOut(200); });
	});
	$inventory.addClass('bomb');
	setTimeout(function(){ $inventory.removeClass('bomb'); }, 30*50);
}