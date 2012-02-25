function PlayerView(player) {
	this.player = player;
	this.isPlayer = (this.player instanceof Player);
	
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
		}
	});
}

PlayerView.prototype.render = function() {
	var html = '';
	var x, y, b;
	
	// update ghost block
	if(this.isPlayer)
		this.player.updateGhostBlock();
		
	// update board
	for(y = 0; y < this.player.height; ++y) {
		html += '<div class="row">';
		for(x = 0; x < this.player.width; ++x) {
			b = this.player.at(x,y);
			html += '<div class="cell '+(b !== 0 ? (typeof b === 'string' ? 'special special-'+b : 'block block-'+b) : 'empty')+'"> </div>';
		}
		html += '</div>';
	}
	this.el.find('.board').html('<div class="board-wrapper">'+html+'</div>');
	
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
					html += '<div class="cell '+(b ? 'block block-'+b : 'empty')+'"> </div>';
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
	var $original = this.el.find('.board .row').eq(y);
	var $clear = $original.clone()
		.appendTo(this.el)
		.css({position: 'absolute'})
		.offset($original.offset())
		.animate({top: '+=20px', opacity: 0}, 250, function() { $clear.remove(); });
}

PlayerView.prototype.specialNuke = function() {
	var $board = this.el.find('.board');
	$board.addClass('nuke');
	var xpos = Math.round((480 - $board.width()) * 0.5)-20;
	$board.css({
		'background': "black -"+xpos+"px bottom no-repeat url('../images/nuke.gif?" + Date.now() + "')"
	});
	setTimeout(function() {
		$board.removeClass('nuke');
		$board.css({
			'background': 'transparent'
		});
	}, 2000);
}

PlayerView.prototype.specialQuake = function() {
	var count = 20;
	var board = this.el.find('.board');
	var shakeFunction = function(){
		if (count--) {
			board.css({
				'margin-left': Math.round(Math.random()*(count&1?-1:1)*30),
				'margin-top': Math.round((Math.random()-0.5)*30)
				//'-webkit-transform': 'rotate(' + Math.round((Math.random()-0.5)*40) + 'deg)'
			});
			setTimeout(shakeFunction, 50);
		}
		else {
			board.css({
				'margin-left': 0,
				'margin-top': 0
				//'-webkit-transform': 'rotate(0deg)'
			});
		}
	};
	shakeFunction();
}

PlayerView.prototype.specialBomb = function() {
	// BOOOM!
	var nodes = $();
	this.el.find('.board .special-b').each(function() {
		nodes.add(
			$('<div class="explosion" />')
				.offset($(this).offset())
				.appendTo('#container')
				.css({'background-image': "url('../images/explosion.gif?" + Date.now() + "')"}));
	});
	if(nodes.length)
		setTimeout(function(){ nodes.remove(); }, 2000);
}