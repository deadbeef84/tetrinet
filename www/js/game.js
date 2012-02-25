function Game(name, port) {
	
	this.player = null;
	this.players = {};
	this.notify = false;
	this.keyCount = 0;
	this.checkNotify();
	this.startTime = 0;
	this.linesRemoved = 0;
	this.linesSent = 0;
	this.options = {};
	this.attackNotifierSlots = [];
	this.lastMoveRotate = false;
	this.lastDropTspin = false;
	this.backToBack = false;
	this.view = new GameView(this);
	
	var self = this;
	
	if (name) {
		this.socket = io.connect('//'+location.hostname+':'+port, {reconnect: false});
		this.socket.on('error', function(event) {
			console.log(event);
		});
		this.socket.on('connect', function(event) {
			self.send({t: Message.JOIN, name:name});
		});
		this.socket.on('message', function(msg) {
			self.handleMessage(JSON.parse(msg));
		});
		this.socket.on('disconnect', function(event) {
			self.player = null;
			//$('body').html('Disconnected');
		});
	
	} else {
	
		// this is a single player game
		
		this.handleMessage({ t:Message.SET_ROOM, r: {name: 'singleplayer', options:{height:24, width:12, specials: false, generator: 1, entrydelay: 0, rotationsystem: 1, tspin: true, holdpiece: true, nextpiece: 3}}});
		this.handleMessage({ t:Message.SET_PLAYER, self:true, p:{index:0, name:"You"} });
	}
	
	this.view.init();
}

Game.LOG_LINES = 'log-lines';
Game.LOG_STATUS = 'log-status';
Game.LOG_SPECIAL = 'log-special';
Game.LOG_SPECIAL_SENT = 'log-special-sent';
Game.LOG_SPECIAL_RECIEVED = 'log-special-recieved';
Game.LOG_FILTERS = {
	'Status messages': Game.LOG_STATUS,
	'Lines': Game.LOG_LINES,
	'All specials': Game.LOG_SPECIAL,
	'Specials sent': Game.LOG_SPECIAL_SENT,
	'Specials recieved': Game.LOG_SPECIAL_RECIEVED
};
Game.LOG_DEFAULT_FILTER_TABS = [{
	title: 'All',
	classes: ['log-status', 'log-lines', 'log-special'],
	closeButton: false
}];

Game.prototype.moveLeft = function() {
	if(this.player) {
		this.player.move(-1,0,0,false);
		this.lastMoveRotate = false;
	}
}
Game.prototype.moveRight = function() {
	if(this.player) {
		this.player.move(1,0,0,false);
		this.lastMoveRotate = false;
	}
}
Game.prototype.moveDown = function() {
	if(this.player)
		this.player.move(0,1,0,false);
}
Game.prototype.drop = function() {
	if(this.player)
		this.player.falldown(true);
}
Game.prototype.softDrop = function() {
	if(this.player)
		this.player.falldown(false);
}
Game.prototype.rotateClockwise = function() {
	if(this.player) {
		this.player.move(0,0,1,false);
		this.lastMoveRotate = true;
	}
}
Game.prototype.rotateCounterClockwise = function() {
	if(this.player) {
		this.player.move(0,0,1,false);
		this.lastMoveRotate = true;
	}
}

Game.prototype.checkNotify = function() {
	var p = window.webkitNotifications ? window.webkitNotifications.checkPermission() : 2;
	if (p == 0)
		this.notify = true;
	else if(p == 1) {
		var _this = this;
		$('<button>Activate notifications</button>')
			.css({position:'absolute',top:0,left:0})
			.click(function() {
				window.webkitNotifications.requestPermission(function() { _this.checkNotify(); });
				$(this).remove();
			})
			.appendTo('body');
	}
}

Game.prototype.createNotification = function(sender, message) {
	var notification = window.webkitNotifications.createNotification("images/explosion.gif", "Tetrinet: " + sender, message);
	setTimeout(function() { notification.cancel(); }, 2000);
	notification.show();
}

Game.prototype.send = function(msg) {
	if (this.socket) {
		this.socket.send(JSON.stringify(msg));
	} else {
		switch (msg.t) {
			case Message.START:
				var i = Math.floor(Math.random() * 1000000000);
				this.handleMessage({t:Message.START, seed:i});
				break;
			case Message.GAMEOVER:
				this.handleMessage({t:Message.GAMEOVER, id:this.player.id});
				break;
			case Message.UPDATE_BOARD:
				this.handleMessage({t:Message.UPDATE_BOARD, id:this.player.id, d:msg.d});
				break;
			default:
				// ???
		}
	}
}

Game.prototype.sendBoard = function() {
	if (this.player) {
		this.send({t: Message.UPDATE_BOARD, d: this.player.data});
	}
}

Game.prototype.gameLog = function(msg, logClass) {
	if (!isArray(logClass))
		logClass = [logClass];
	for (i in logClass)
		logClass[i] = '#gamelog > div.' + logClass[i];
	var c = $(logClass.join(','));
	c.append('<p>'+msg+'</p>');
	c.each(function(){
		this.scrollTop = this.scrollHeight;
		while ($(this).children().length > Settings.log.buffer_size)
			$(this).children(':first').remove();
	});
}

Game.prototype.chat = function(msg) {
	var c = $('#chat');
	c.append($('<p>').text(msg));
	c[0].scrollTop = c[0].scrollHeight;
}

Game.prototype.use = function(id) {
	if(this.player.inventory && this.player.inventory.length) {
		var p = this.players[id];
		if (p && p.isPlaying) {
			var logClass = [ Game.LOG_SPECIAL, Game.LOG_SPECIAL_SENT ];
			if (id == this.player.id)
				logClass.push(Game.LOG_SPECIAL_RECIEVED);
			var s = this.player.inventory.shift();
			this.gameLog('<em>'+htmlspecialchars(this.player.name)+'</em> used special <strong>' + Special.getSpecial(s).name + '</strong> on <em>' + htmlspecialchars(p.name) + '</em>', logClass);
			var msg = {t: Message.SPECIAL, 's': s, id: p.id};
			if(s == Special.SWITCH) {
				// switch needs some manual work
				if(p !== this.player) {
					msg.data = this.player.data;
					this.player.data = p.data.slice(0);
					this.send(msg);
					this.player.emit(Board.EVENT_CHANGE);
				} else {
					// even if switch doesnt do anything on ourself,
					// we must still let everyone know we used the switch
					this.send(msg);
				}
			} else {
				this.send(msg);
				if(p === this.player)
					this.player.use(msg);
				else
					p.emit(Player.EVENT_SPECIAL, msg);
			}
			this.player.emit(Player.EVENT_INVENTORY); // need to update inventory
		}
	}
}

Game.prototype.removePlayer = function(index) {
	var p = this.players[index];
	/*
	TODO: fix this
	if (this.target == p.id && this.player.isPlaying)
		this.cycleTarget(-1);
	var targetIndex = this.targetList.indexOf(p.id);
	if (targetIndex > -1)
		this.targetList.splice(targetIndex, 1);
	*/
	p.view.el.remove();
	delete this.players[index];
	this.updatePlayers();
}

Game.prototype.updatePlayers = function() {
	for(var pp in this.players) {
		var p = this.players[pp];
		p.view.el.find('h2')
			.text('(' + (p.id + 1) + ') ' + p.name)
			.css({backgroundColor: p.team});
	}
}

Game.prototype.getStats = function() {
	var t = (new Date().getTime() - this.startTime) / 1000;
	return {
		time: t,
		keys: this.keyCount,
		kpm: Math.round(this.keyCount / t * 60),
		blocks: this.player.numBlocks,
		bpm: Math.round(this.player.numBlocks / t * 60),
		lines: this.linesRemoved,
		lines_sent: this.linesSent
	};
}

Game.prototype.printStats = function() {
	var s = this.getStats();
	this.chat('KPM: ' + s.kpm +' (keycount: ' + s.keys + ' time: ' + s.time + ')');
	this.chat('BPM: ' + s.bpm);
	this.chat('Lines removed ' + s.lines + ', sent: ' + s.lines_sent);
}

Game.prototype.handleMessage = function(msg) {
	var self = this;
	switch(msg.t) {
		case Message.SET_PLAYER:
			var p;
			if (msg.self) {
				p = this.player = new Player();
				p.view = new PlayerView(p);
				p.view.el.prependTo('#gamearea').addClass('self');
				
				p.on(Board.EVENT_CHANGE, function() {
					self.sendBoard();
				});
				p.on(Player.EVENT_GAMEOVER, function() {
					self.printStats();
					self.send({t:Message.GAMEOVER, s: self.getStats()});
					p.view.el.addClass('gameover');
					$('.player').removeClass('target');
				});
				p.on(Board.PUT_BLOCK, function() {
					// check for t-spin
					self.lastDropTspin = false;
					var b = self.player.currentBlock;
					if (b.type == 2) {
						var surrounded = 0;
						var c = [[-1,-1],[1,-1],[-1,1],[1,1]];
						for (var i = 0; i < c.length; i++)
							surrounded += (self.player.data[(b.y + 1 + c[i][1]) * self.player.width + b.x + 1 + c[i][0]] ? 1 : 0);
						if (self.lastMoveRotate && surrounded >= 3) {
							self.lastDropTspin = true;
						}
					}
				});
				p.on(Board.EVENT_LINES, function(l) {
					var linesToAdd = l - 1;
					var b = self.player.currentBlock;
					// tetris
					if (b.type == 1 && l == 4) {
						linesToAdd = l;
					}
					// t-spin
					if (self.lastDropTspin && self.options.tspin) {
						linesToAdd = l * 2;
					}
					if (linesToAdd > 0 && self.backToBack)
						linesToAdd++;
					if (linesToAdd > 0) {
						self.linesSent += linesToAdd;
						self.gameLog('<em>' + htmlspecialchars(self.player.name) + '</em> added <strong>' + linesToAdd + '</strong> lines to all', [ Game.LOG_LINES ]);
						self.send({t: Message.LINES, n: linesToAdd});
					}
					// clear board
					var boardCleared = true;
					for (var i = 0; i < self.player.data.length; i++) {
						boardCleared = boardCleared && !self.player.data[i];
					}
					self.linesRemoved += l;
					self.backToBack = self.lastDropTspin;
				});
				p.on(Player.EVENT_DROP, function() {
					self.lastMoveRotate = false;
				});
				p.setOptions(this.options);
			} else {
				p = new Board();
				p.view = new PlayerView(p);
			}
			p.setSize(this.options.width, this.options.height);
			p.name = msg.p.name;
			p.team = msg.p.team;
			p.id = msg.p.index;
			if(msg.join)
				this.gameLog('<em class="status">' + htmlspecialchars(p.name) + ' joined the game</em>', Game.LOG_STATUS);
			if(this.players[p.id])
				this.removePlayer(p.id);
			this.players[p.id] = p;
			this.updatePlayers();
			/* TODO
			if (msg.self)
				this.targetList.unshift(p.id);
			else
				this.targetList.push(p.id);
				*/
			break;
			
		case Message.GAMEOVER:
			var p = this.players[msg.id];
			p.isPlaying = false;
			this.gameLog(htmlspecialchars(p.name) + ' is dead.', Game.LOG_STATUS);
			p.view.el.addClass('gameover');
			/* TODO
			if (this.target == p.id && p.id != this.player.id)
				this.cycleTarget(-1);
				*/
			break;
			
		case Message.WINNER:
			for(var i in msg.id) {
				var p = this.players[msg.id[i]];
				p.isPlaying = false;
				p.view.el.addClass('winner');
				if (p === this.player) {
					this.send({t: Message.WINNER, s: this.getStats()});
					this.player.stop();
					this.printStats();
					$('body').addClass('winner');
					$('.player').removeClass('target');
				}
				this.gameLog(htmlspecialchars(p.name) + ' has won the game.', [ Game.LOG_STATUS ]);
			}
			break;
			
		case Message.LINES:
			var name = msg.id != null ? this.players[msg.id].name : 'Server';
			this.gameLog('<em>' + htmlspecialchars(name) + '</em> added <strong>' + msg.n + '</strong> lines to all', [ Game.LOG_LINES ]);
			if (this.player.isPlaying) {
				this.player.addLines(msg.n);
				this.player.moveUpIfBlocked();
				this.sendBoard();
			}
			break;
		
		case Message.REMOVE_PLAYER:
			var p = this.players[msg.id];
			if(p) {
				this.gameLog('<em class="status">' + htmlspecialchars(p.name) + ' left the game</em>', Game.LOG_STATUS);
				this.removePlayer(msg.id);
			}
			break;
			
		case Message.START:
			this.keyCount = 0;
			this.linesRemoved = 0;
			this.linesSent = 0;
			this.startTime = (new Date().getTime());
			//$('#gamelog').empty();
			$('body').removeClass('winner');
			$('.player').removeClass('gameover winner');
			for(var p in this.players)
				this.players[p].isPlaying = true;
			this.player.start(msg.seed);
			/* TODO
			this.setTarget(this.player.id);*/
			break;
			
		case Message.UPDATE_BOARD:
			var p = this.players[msg.id];
			p.data = msg.d;
			p.emit(Board.EVENT_UPDATE);
			break;
			
		case Message.CHAT:
			var name;
			if (msg.id == null) {
				name = 'Server';
				this.gameLog('<em class="status">'+ msg.text +'</em>', Game.LOG_STATUS);
			} else {
				name = this.players[msg.id].name;
				this.chat(name + ': ' + msg.text);
			}
			if (this.notify && !Bw.windowIsActive) {
				this.createNotification(name, msg.text);
			}
			break;
			
		case Message.SPECIAL:
			var sourcePlayer = this.players[msg.sid];
			var targetPlayer = this.players[msg.id];
			if (targetPlayer) {
				var logClass = [ Game.LOG_SPECIAL ];
				if (msg.sid == this.player.id)
					logClass.push(Game.LOG_SPECIAL_SENT);
				if (msg.id == this.player.id)
					logClass.push(Game.LOG_SPECIAL_RECIEVED);
				this.gameLog('<em class="'+(msg.sid==this.player.id?'self':'other')+'">' + sourcePlayer.name + '</em> ' + (msg.reflect ? 'reflected' : 'used') + ' special <strong>' + Special.getSpecial(msg.s).name + '</strong> on <em class="'+(msg.id==this.player.id?'self':'other')+'">' + targetPlayer.name + '</em>', logClass);
				if(targetPlayer.id == this.player.id) {
					if(this.player.reflect) {
						if (msg.reflect) {
							
						} else {
							msg.id = msg.sid;
							msg.reflect = true;
							delete msg.sid;
							this.send(msg);
						}
					} else {
						if (Settings.misc.attack_notifications) {
							var $msg = $('<p class="attack"><em>' + sourcePlayer.name + '</em> ' + (msg.reflect ? 'reflected' : 'used') + ' special <em>' + Special.getSpecial(msg.s).name + '</em></p>');
							var offset = 0;
							for (var i = 0; this.attackNotifierSlots[i]; i++, offset++) ;
							this.attackNotifierSlots[offset] = true;
							$msg.data('offset', offset);
							$msg.css('top', offset * 50);
							setTimeout(function(obj){
								obj.animate({'opacity':0}, 500, function(){
									self.attackNotifierSlots[$(this).data('offset')] = false;
									$(this).remove();
								});
							}, 2000, $msg);
							this.player.view.el.append($msg);
						}
						this.player.use(msg);
					}
				} else {
					targetPlayer.emit(Player.EVENT_SPECIAL, msg);
				}
			}
			break;
			
		case Message.ROOMS:
			var $rooms = $('#lobby ul').empty();
			for(var i=0; i < msg.r.length; ++i)
				$rooms.append('<li><a href="#">'+msg.r[i].n + '</a> (' + msg.r[i].p + ')</li>');
			break;
			
		case Message.SET_ROOM:
			// clear players
			for(var pp in this.players) {
				var p = this.players[pp];
				p.removeAllListeners();
				p.view.el.remove();
			}
			this.players = {};
			this.updatePlayers();
			this.team = '';
			$('#team').val(this.team);
			$('#gamelog > div').empty();
			if(msg.r) {
				// joined room
				this.options = msg.r.options;
				$('#lobby').hide();
				$('#ingame').show();
			} else {
				// back to lobby
				$('#lobby').show();
				$('#ingame').hide();
			}
			break;
			
		case Message.NAME:
			this.gameLog('<em>' + this.players[msg.id].name + '</em> is now known as <em>' + msg.name + '</em>', [ Game.LOG_STATUS ]);
			this.players[msg.id].name = msg.name;
			this.updatePlayers();
			break;
			
		default:
			alert('Unknown message type: ' + msg.t);
			break;
	}
}
Object.freeze(Game.prototype);
Object.freeze(Game);
