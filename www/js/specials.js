function Special() {
}

Special.specialIds = [];
Special.specials = {};

Special.registerSpecial = function(id, name, description, apply) {
	if(Special.specials[id])
		throw new Error('Special already set ' + id + ' ' + name);
	Special.specialIds.push(id);
	Special.specials[id] = {
		name: name,
		description: description,
		apply: apply
	};
}

Special.getSpecial = function(id) {
	return Special.specials[id];
}

Special.setOccurancy = function(occurancy) {
	this.occurancy = occurancy;
	this.totalOccurancy = 0;
	for(var s in occurancy)
		this.totalOccurancy += occurancy[s];
}

Special.getRandomSpecial = function() {
	var i = Math.floor(this.totalOccurancy * Math.random());
	for(var s in this.occurancy) {
		i -= this.occurancy[s];
		if(i < 0)
			return s;
	}
	throw new Error('Unable to get random special');
}

Special.ADD_LINE = 'a';
Special.CLEAR_LINE = 'c';
Special.NUKE = 'n';
Special.QUAKE = 'q';
Special.CLEAR_RANDOM = 'r';
Special.CLEAR_SPECIALS = 's';
Special.GRAVITY = 'g';
Special.BOMB = 'b';
Special.SWITCH = 'w';
Special.LGRAVITY = 'l';
Special.ZEBRA = 'z';
Special.FLIP = 'f';
Special.INVISIBLE = 'i';
Special.REFLECT = 'x';
Special.GAMEOFLIFE = 'o';
Special.GLUE = 'u';
Special.RICKROLL = 'd';
Special.MOSES = 'm';
Special.INVERT = 'v';
Special.SPEED = 'p';
Special.RANDOM = 'y';
Special.SBLOCKS = 'k';
Special.INVENTORY_BOMB = 't';

Special.setOccurancy({
	a: 16,
	c: 13,
	n: 1,
	q: 10,
	r: 12,
	s: 12,
	g: 5,
	b: 12,
	w: 3,
	l: 4,
	z: 1,
	f: 6,
	i: 5,
	x: 5,
	o: 2,
	u: 2,
	d: 6,
	m: 2,
	v: 2,
	p: 4,
	y: 3,
	k: 3,
	t: 0
});

Special.registerSpecial(
	Special.ADD_LINE,
	"Add line",
	"Add one line to the bottom of the field.",
	function(player, msg) {
		player.addLines(1);
		return true;
	}
);

Special.registerSpecial(
	Special.CLEAR_LINE,
	"Clear line",
	"Remove one line from the bottom of the field.",
	function(player, msg) {
		player.data.splice((player.height - 1) * player.width, player.width);
		for(var x=0; x < player.width; ++x)
			player.data.unshift(0);
		return true;
	}
);

Special.registerSpecial(
	Special.NUKE,
	"Nuke",
	"Clears the entire field.",
	function(player, msg) {
		for(var i = 0; i < player.width * player.height; ++i)
			player.data[i] = 0;
		return true;
	}
);

Special.registerSpecial(
	Special.QUAKE,
	"Quake",
	"Shakes the field.",
	function(player, msg) {
		for(var i = 0; i < player.height; ++i) {
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
			var l = player.data.splice(i*player.width, player.width);
			for(var x = 0; x < player.width; ++x)
				player.data.splice(i*player.width+x, 0, l[(x+amount+player.width) % player.width]);
		}
		return true;
	}
);

Special.registerSpecial(
	Special.CLEAR_RANDOM,
	"Clear random",
	"Removes up to 10 random pieces from the field.",
	function(player, msg) {
		for(var i = 0; i < 10; ++i)
			player.data[Math.floor(Math.random()*player.data.length)] = 0;
		return true;
	}
);

Special.registerSpecial(
	Special.CLEAR_SPECIALS,
	"Clear specials",
	"Remove specials from the playing field.",
	function(player, msg) {
		var change = false;
		for(var i = 0; i < player.data.length; ++i) {
			if(typeof player.data[i] === 'string') {
				player.data[i] = 1 + Math.floor(Math.random() * Block.blockData.length);
				change = true;
			}
		}
		return change;
	}
);
	
Special.registerSpecial(
	Special.GRAVITY,
	"Gravity",
	"Make pieces fall down as if there were gravity.",
	function(player, msg) {
		for(var x = 0; x < player.width; ++x) {
			var py = player.height - 1;
			for(var y = player.height - 1; y >= 0; --y) {
				if(player.data[y * player.width + x]) {
					player.data[py * player.width + x] = player.data[y * player.width + x]
					--py;
				}
			}
			while(py >= 0)
				player.data[py-- * player.width + x] = 0;
		}
		return true;
	}
);
	
Special.registerSpecial(
	Special.BOMB,
	"Bomb",
	"When used on field with a bomb, that bomb and it's surrounding pieces will blow up.",
	function(player, msg) {
		var change = false;
		for(var y = 0; y < player.height; ++y) {
			for(var x = 0; x < player.width; ++x) {
				if(player.data[y*player.width + x] == Special.BOMB) {
					player.data[y*player.width + x] = 0;
					var around = [];
					for(var yy = y-1; yy <= y+1; ++yy) {
						for(var xx = x-1; xx <= x+1; ++xx) {
							if(xx < 0 || xx >= player.width || yy < 0 || yy >= player.height || (xx == x && yy == y))
								continue;
							var d = player.data[yy*player.width + xx];
							if(d == Special.BOMB)
								around.push(0);
							else {
								around.push(d);
								player.data[yy*player.width + xx] = 0;
							}
						}
					}
					for(var i = 0; i < around.length; ++i) {
						var yy = Board.VANISH_ZONE_HEIGHT + 6 + Math.floor(Math.random() * (player.height - Board.VANISH_ZONE_HEIGHT - 6));
						var xx = Math.floor(Math.random() * player.width);
						player.data[yy*player.width + xx] = around[i];
					}
					change = true;
				}
			}
		}
		return change;
	}
);
	
Special.registerSpecial(
	Special.SWITCH,
	"Switch",
	"Switch fields with other player.",
	function(player, msg) {
		if(msg.data) {
			player.data = msg.data;
			for(var y = 0; y < Board.VANISH_ZONE_HEIGHT + 6; ++y) {
				for(var x = 0; x < player.width; ++x) {
					player.data[y * player.width + x] = 0;
				}
			}
			return true;
		}
		return false;
	}
);
	
Special.registerSpecial(
	Special.LGRAVITY,
	"Left gravity",
	"Move pieces to the left side of the field.",
	function(player, msg) {
		for(var y = 0; y < player.height; ++y) {
			var px = 0;
			for(var x = 0; x < player.width; ++x) {
				if(player.data[y * player.width + x]) {
					player.data[y * player.width + px] = player.data[y * player.width + x]
					++px;
				}
			}
			while(px < player.width)
				player.data[y * player.width + px++] = 0;
		}
		return true;
	}
);
	
Special.registerSpecial(
	Special.ZEBRA,
	"Zebra field",
	"Clear every other vertical line.",
	function(player, msg) {
		for(var y = 0; y < player.height; ++y) {
			for(var x = (player.zebra ? 1 : 0); x < player.width; x += 2) {
				player.data[y * player.width + x] = 0;
			}
		}
		player.zebra = !player.zebra;
		return true;
	}
);
	
Special.registerSpecial(
	Special.FLIP,
	"Flip",
	"Flip left/right controls",
	function(player, msg) {
		player.flip = !player.flip;
		player.flipTimer.start();
		return false;
	}
);
	
Special.registerSpecial(
	Special.INVISIBLE,
	"Invisible",
	"Limits the visibility of the field.",
	function(player, msg) {
		player.invisible = true;
		player.invisibleTimer.addDelay(Player.TIME_INVISIBLE);
		player.invisibleTimer.start();
		return true;
	}
);
	
Special.registerSpecial(
	Special.REFLECT,
	"Reflect",
	"Reflect other players specials back to the attacker for 10 seconds.",
	function(player, msg) {
		player.reflect = true;
		player.reflectTimer.addDelay(Player.TIME_REFLECT);
		player.reflectTimer.start();
		return false;
	}
);
	
Special.registerSpecial(
	Special.GAMEOFLIFE,
	"Game of Life",
	"Run one iteration of Conway's Game of Life",
	function(player, msg) {
		var d = [];
		for(var y = 0; y < player.height; ++y) {
			for(var x = 0; x < player.width; ++x) {
				var around = 0;
				for(var yy = y-1; yy <= y+1; ++yy) {
					for(var xx = x-1; xx <= x+1; ++xx) {
						if(xx < 0 || xx >= player.width || yy < 0 || yy >= player.height || (xx == x && yy == y))
							continue;
						if(player.data[yy*player.width + xx])
							++around;
					}
				}
				var alive = player.data[y*player.width + x];
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
		player.data = d;
		return true;
	}
);
	
Special.registerSpecial(
	Special.GLUE,
	"Glue piece",
	"The falling piece will be sent to the bottom of the field, or stuck in the middle.",
	function(player, msg) {
		if(player.currentBlock) {
			if(player.currentBlock.y >= Board.VANISH_ZONE_HEIGHT + 6) {
				player.putBlock(player.currentBlock);
				player.createNewBlock();
			} else {
				player.falldown(true);
			}
		}
		return false;
	}
);
	
Special.registerSpecial(
	Special.RICKROLL,
	"Rickroll",
	"Never Gonna Give You Up...",
	function(player, msg) {
		$('body').addClass('rickroll-' + (++player.rickroll));
		setTimeout(function() {
			$('body').removeClass('rickroll-' + (player.rickroll--));
		}, 10000);
		return false;
	}
);
	
Special.registerSpecial(
	Special.MOSES,
	"Moses",
	"Divides the field just like moses divided the waters with gods help.",
	function(player, msg) {
		for(var y = 0; y < player.height; ++y) {
			var newRow = [];
			for(var x = 0; x < player.width; ++x) {
				if (player.data[y * player.width + x])
					newRow.push(player.data[y * player.width + x]);
			}
			for (var x = player.width - newRow.length; x > 0; --x)
				newRow.splice(Math.ceil(newRow.length / 2), 0, 0);
			for (var x = 0; x < player.width; ++x)
				player.data[y * player.width + x] = newRow[x];
		}
		return true;
	}
);
	
Special.registerSpecial(
	Special.INVERT,
	"Invert",
	"Turns the occupied blocks into empty blocks and vice versa.",
	function(player, msg) {
		var y = player.height - 1;
		function invertRow() {
			var inv = false;
			for(var yy = y; yy > 0; --yy) {
				for(var x = 0; x < player.width; ++x) {
					if(player.data[y * player.width + x]) {
						inv = true;
						yy = 0;
						break;
					}
				}
			}
			if(inv) {
				for(var x = 0; x < player.width; ++x)
					player.data[y * player.width + x] = player.data[y * player.width + x] ? 0 : 1 + Math.floor(Math.random() * Block.blockData.length);
				player.emit(Board.EVENT_CHANGE);
				if(--y >= Board.VANISH_ZONE_HEIGHT + 6)
					setTimeout(invertRow, 50);
			}
		}
		invertRow();
		return true;
	}
);
	
Special.registerSpecial(
	Special.SPEED,
	"Speed",
	"Increases the falling speed of blocks.",
	function(player, msg) {
		var maxHeight = 0;
		for(var y = player.height-1; y >= 0; --y) {
			for(var x = 0; x < player.width; ++x) {
				if(player.data[y * player.width + x]) {
					maxHeight = player.height - y;
					break; // todo: fix this
				}
			}
		}
		player.speed = true;
		player.speedTimer.addDelay(Player.TIME_SPEED);
		player.speedTimer.start();
		player.dropTimer.delay = 50 + maxHeight * 6;
		player.dropTimer.start();
		$('body').addClass('speed');
		return false;
	}
);
	
Special.registerSpecial(
	Special.RANDOM,
	"Surprise",
	"Picks a random special.",
	function(player, msg) {
		var m = {};
		m.s = Special.specialIds[Math.floor(Math.random() * Special.specialIds.length)];
		player.use(m);
		return false;
	}
);
	
Special.registerSpecial(
	Special.SBLOCKS,
	"S-blocks",
	"Only generate S and Z blocks for a limited amount of time.",
	function(player, msg) {
		for(var i = 0; i < 4; ++i)
			player.nextBlocks.unshift(new Block(Math.random() < 0.5 ? 5 : 6, 0));
		return true;
	}
);
	
Special.registerSpecial(
	Special.INVENTORY_BOMB,
	"Inventory bomb",
	"Reorders and randomly removes specials from an opponents inventory.",
	function(player, msg) {
		var newInventory = [];
		$.each(player.inventory, function(i, obj) {
			if (Math.random() > 0.05)
				newInventory.push(Math.random() > 0.5 ? obj : Special.getRandomSpecial());
		});
		for (var i = 1; i < newInventory.length - 1; i++) {
			var swap = i;
			var rand = Math.random();
			if (rand < 0.25)
				i--;
			else if (rand < 0.5)
				i++;
			var obj = newInventory[swap];
			newInventory[swap] = newInventory[i];
			newInventory[i] = obj;
		}
		console.log(player.inventory, newInventory);
		player.inventory = newInventory;
		return true;
	}
);

Bw.recursiveFreeze(Special);