function PlayerView(player) {
	this.player = player;
	this.isPlayer = (this.player instanceof Player);
	this.notifierSlots = [];

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

PlayerView.prototype.specialMoses = function() {
	var $rainbow = $('<div class="nyancat-rainbow" />');
	var $nyancat = $('<div class="nyancat" />');
	var centerOffset = this.el.find('.board .row:first .cell').eq(Math.floor(this.player.width/2)).offset();
	var boardHeight = this.el.find('.board').height();
	centerOffset.left -= 3;
	$rainbow.appendTo('#container')
		.offset(centerOffset)
		.css({ height: 0 })
		.animate({ height: boardHeight }, 1000, function(){
			$(this).animate({ opacity: 0 }, 1000, function(){ $(this).remove(); });
		});
	$nyancat.appendTo('#container')
		.offset(centerOffset)
		.css({ top: centerOffset.top - 8 })
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
	var animationLen = this.isPlayer ? 300 : 150;
	var $rows = this.el.find('.board .row');
	for (var x = (this.player.zebra ? 1 : 0), i = 0; x < this.player.width; x += 2, i++) {
		var $column = $('<div class="column"/>');
		for (var y = 0; y < this.player.height; y++) {
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
			obj.animate({top: animationDir+'='+animationLen+'px', opacity: 0}, 300, function(){ obj.remove(); });
		}, i*100, $column);
	}
}