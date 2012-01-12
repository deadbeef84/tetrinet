function Game(name, token) {
	
	this.player = null;
	this.players = {};
	this.notify = false;
	this.keyCount = 0;
	this.checkNotify();
	this.startTime = 0;
	this.linesRemoved = 0;
	this.linesSent = 0;
	this.options = {};
	
	var self = this;
	
	if (name) {
	
		this.socket = io.connect('//'+location.hostname+':7000');
		
		this.socket.on('error', function(event) {
			console.log(event);
		});
		this.socket.on('connect', function(event) {
			// send name
			self.chat('You are now connected');
			self.send({t: Message.JOIN, name:name, token: token});
			/*setInterval(function() {
				//if(self.ws.readyState == WebSocket.OPEN) {
					self.send({t: Message.PING});
				//}
			}, 2500);*/
		});
		this.socket.on('message', function(msg) {
			//try {
				self.handleMessage(JSON.parse(msg));
			//}
			//catch(e) {
			//	console.log(e);
			//	alert(e.toString() + '\n' + e.filename + ':' + e.lineNumber);
			//}
		});
		this.socket.on('disconnect', function(event) {
			self.chat("socket closed");
		});
	
	} else {
	
		// this is a single player game
		
		this.handleMessage({ t:Message.OPTIONS, o:{height:24, width:12, specials: false} });
		this.handleMessage({ t:Message.SET_PLAYER, self:true, p:{index:0, name:"You"} });
	}
	
	$(document).keydown(function(e) {
		
		if (document.activeElement && $(document.activeElement).filter(':text').length)
			return;
		
		if (self.player && self.player.isPlaying) {
			
			switch (e.which) {
				case Settings.keymap.left:			self.player.move(-1,0,0,false); break;
				case Settings.keymap.right:			self.player.move(1,0,0,false); break;
				case Settings.keymap.down:			self.player.move(0,1,0,false); break;
				case Settings.keymap.drop:			self.player.falldown(true); break;
				case Settings.keymap.soft_drop:		self.player.falldown(false); break;
				case Settings.keymap.rotate_cw:		self.player.move(0,0,1,false); break;
				case Settings.keymap.rotate_ccw:	self.player.move(0,0,-1,false); break;
				case Settings.keymap.inventory_1:	self.use(0); break;
				case Settings.keymap.inventory_2:	self.use(1); break;
				case Settings.keymap.inventory_3:	self.use(2); break;
				case Settings.keymap.inventory_4:	self.use(3); break;
				case Settings.keymap.inventory_5:	self.use(4); break;
				case Settings.keymap.inventory_6:	self.use(5); break;
				case Settings.keymap.inventory_7:	self.use(6); break;
				case Settings.keymap.inventory_8:	self.use(7); break;
				case Settings.keymap.inventory_9:	self.use(8); break;
				case Settings.keymap.inventory_self:
					self.use(self.player.id);
					break;
				case Settings.keymap.inventory_target_left:
				case Settings.keymap.inventory_target_right:
				case Settings.keymap.inventory_target_send:
					// unused for now
					break;
				default:
					// unrecognized key
					return;
			}
			++self.keyCount;
			return false;
		}
	});
	
	$('#startbtn button').click(function() {
		self.send({t:Message.START});
	});
	
	$('#chatbox form').submit(function() {
		var msg = $('#message').val();
		$('#message').val('');
		if(self.player && self.player.isPlaying) {
			var input = true;
			if(msg == 'LEFT')
				self.player.move(-1,0,0,false);
			else if(msg == 'RIGHT')
				self.player.move(1,0,0,false);
			else if(msg == 'DROP') // space
				self.player.falldown(true);
			else if(msg == 'ROTATE')
				self.player.move(0,0,1,false);
			else
				input = false;
			if(input) {
				return false;
			}
		}
		self.chat('You: ' + msg);
		self.send({t:Message.CHAT, text: msg});
		return false;
	});
	
	var initSettings = function() {
		$('#settings_name').val(Settings.name);
		$('#settings_keys input').each(function(index) {
			$(this).val(getCharFromKeyCode(Settings.keymap[$(this).attr('name')]));
			$(this).data('keycode', Settings.keymap[$(this).attr('name')]);
		});
	};
	var toggleSettings = function() {
		if (!$('#settingsbox').hasClass('active'))
			initSettings();
		$('#settingsbox').slideToggle();
		$('#settingsbox').toggleClass('active');
		//$('#settings_show').slideToggle();
		return false;
	};
	
	$('#settings_show').show().click(toggleSettings);
	$('#settings_cancel').click(toggleSettings);
	
	$('#settings').submit(function(){
		// set settings
		Settings.name[$('#settings_name').val()];
		$('#settings_keys input').each(function() {
			Settings.keymap[$(this).attr('name')] = $(this).data('keycode');
		});
		var date = new Date();
		$.cookies.set('name', Settings.name, { expiresAt: new Date(date.getFullYear()+1, date.getMonth(), date.getDay()) });
		$.cookies.set('keymap', Settings.keymap, { expiresAt: new Date(date.getFullYear()+1, date.getMonth(), date.getDay()) });
		toggleSettings();
		return false;
	});
    
	$('#settings .keycode_listener').keydown(function(e){
		$(this).val(getCharFromKeyCode(e.which));
		$(this).data('keycode', e.which);
		var nextKeyCodeListener = $(this).parent().nextAll().children('.keycode_listener');
		if (nextKeyCodeListener.length > 0)
			nextKeyCodeListener.first().focus();
		else
			$('#settings_submit').focus();
		return false;
	});
}

Game.LOG_YOU = 'log-you';
Game.LOG_STATUS = 'log-status';
Game.LOG_SPECIAL = 'log-special';
Game.LOG_SPECIAL_SENT = 'log-special-sent';
Game.LOG_SPECIAL_RECIEVED = 'log-special-recieved';
Game.LOG_LINES = 'log-lines';

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
	if (isArray(logClass))
		logClass = logClass.join(' ');
	var c = $('#gamelog');
	c.append('<p class="'+logClass+'">'+msg+'</p>');
	c[0].scrollTop = c[0].scrollHeight;
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
			var logClass = [ Game.LOG_SPECIAL, Game.LOG_SPECIAL_SENT, Game.LOG_YOU ];
			if (id == this.player.id)
				logClass.push(Game.LOG_SPECIAL_RECIEVED);
			var s = this.player.inventory.shift();
			this.gameLog('<em>'+htmlspecialchars(this.player.name)+'</em> used special <strong>' + Player.special[s].name + '</strong> on <em>' + htmlspecialchars(p.name) + '</em>', logClass);
			var msg = {t: Message.SPECIAL, 's': s, id: p.id};
			if(s == Player.SPECIAL_SWITCH) {
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
				if(p === this.player)
					this.player.use(msg);
				this.send(msg);
			}
			this.player.renderInventory(); // need to update inventory
		}
	}
}

Game.prototype.updatePlayers = function() {
	for(var pp in this.players) {
		var p = this.players[pp];
		p.container.find('h2').text('(' + (p.id + 1) + ') ' + p.name);
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
	//console.log(msg);
	switch(msg.t) {
		case Message.SET_PLAYER:
			var p;
			var container = $('<div class="player"><h2>Player</h2><div class="board"></div><div class="nextpiece"></div><div class="inventory"></div></div>').appendTo('#gamearea');
			if(msg.self) {
				container.prependTo('#gamearea');
				container.addClass('self');
				this.player = p = new Player( container );
				var self = this;
				p.on(Board.EVENT_UPDATE, function() {
					self.player.render();
				});
				p.on(Board.EVENT_INVENTORY, function() {
					self.player.renderInventory();
				});
				p.on(Board.EVENT_CHANGE, function() {
					self.player.render();
					self.sendBoard();
				});
				p.on(Player.EVENT_GAMEOVER, function() {
					self.printStats();
					self.send({t:Message.GAMEOVER, s: self.getStats()});
					p.container.addClass('gameover');
				});
				p.on(Board.EVENT_LINES, function(l) {
					self.linesRemoved += l;
					if(l > 1) {
						var linesToAdd = (l == 4 ? l : (l-1));
						self.linesSent += linesToAdd;
						self.gameLog('<em>' + htmlspecialchars(self.player.name) + '</em> added <strong>' + linesToAdd + '</strong> lines to all', [ Game.LOG_LINES, Game.LOG_YOU ]);
						self.send({t: Message.LINES, n: linesToAdd});
					}
				});
				p.specials = this.options.specials;
			} else {
				p = new Board(container);
			}
			p.setSize(this.options.width, this.options.height);
			p.name = msg.p.name;
			p.container = container;
			p.id = msg.p.index;
			this.players[p.id] = p;
			this.updatePlayers();
			break;
			
		case Message.GAMEOVER:
			var p = this.players[msg.id];
			p.isPlaying = false;
			this.gameLog(htmlspecialchars(p.name) + ' is dead.', Game.LOG_STATUS);
			p.container.addClass('gameover');
			break;
			
		case Message.WINNER:
			var p = this.players[msg.id];
			p.isPlaying = false;
			p.container.addClass('winner');
			if (p === this.player) {
				this.send({t: Message.WINNER, s: this.getStats()});
				this.player.stop();
				this.printStats();
				$('body').addClass('winner');
			}
			this.gameLog(htmlspecialchars(p.name) + ' has won the game.', Game.LOG_STATUS);
			break;
			
		case Message.LINES:
			var name = msg.id != null ? this.players[msg.id].name : 'Server';
			this.gameLog('<em>' + htmlspecialchars(name) + '</em> added <strong>' + msg.n + '</strong> lines to all', [ Game.LOG_STATUS, Game.LOG_YOU ]);
			if(this.player.isPlaying) {
				this.player.addLines(msg.n);
				this.player.moveUpIfBlocked();
				this.sendBoard();
			}
			break;
		
		case Message.REMOVE_PLAYER:
			//alert('disconnected ' + msg.id);
			var p = this.players[msg.id];
			//p.destroy();
			p.container.remove();
			delete this.players[msg.id];
			this.updatePlayers();
			break;
			
		case Message.START:
			this.keyCount = 0;
			this.linesRemoved = 0;
			this.linesSent = 0;
			this.startTime = (new Date().getTime());
			$('#gamelog').empty();
			$('body').removeClass('winner');
			$('.player').removeClass('gameover winner');
			for(var p in this.players)
				this.players[p].isPlaying = true;
			this.player.start(msg.seed);
			break;
			
		case Message.UPDATE_BOARD:
			var p = this.players[msg.id];
			p.data = msg.d;
			p.render();
			break;
			
		case Message.CHAT:
			if (msg.id == null) {
				this.gameLog('<em class="status">'+ msg.text +'</em>', Game.LOG_STATUS);
			} else {
				var name = this.players[msg.id].name;
				this.chat(name + ': ' + msg.text);
				if(this.notify && !Bw.windowIsActive) {
					var notification = window.webkitNotifications.createNotification("images/explosion.gif", "Tetrinet: " + name, msg.text);
					setTimeout(function() { notification.cancel(); }, 2000);
					notification.show();
				}
			}
			break;
			
		case Message.SPECIAL:
			var sourcePlayer = this.players[msg.sid];
			var targetPlayer = this.players[msg.id];
			if(targetPlayer) {
				var logClass = [ Game.LOG_SPECIAL ];
				if (msg.sid == this.player.id)
					logClass.push(Game.LOG_SPECIAL_SENT);
				if (msg.id == this.player.id)
					logClass.push(Game.LOG_SPECIAL_RECIEVED);
				if (msg.sid == this.player.id || msg.id == this.player.id)
					logClass.push(Game.LOG_YOU);
				this.gameLog('<em class="'+(msg.sid==this.player.id?'self':'other')+'">' + sourcePlayer.name + '</em> ' + (msg.reflect ? 'reflected' : 'used') + ' special <strong>' + Player.special[msg.s].name + '</strong> on <em class="'+(msg.id==this.player.id?'self':'other')+'">' + targetPlayer.name + '</em>', logClass);
				if(targetPlayer.id == this.player.id) {
					if(this.player.reflect) {
						if(msg.reflect) {
							
						} else {
							msg.id = msg.sid;
							msg.reflect = true;
							delete msg.sid;
							this.send(msg);
						}
					} else {
						var $msg = $('<p class="attack">' + sourcePlayer.name + ' ' + (msg.reflect ? 'reflected' : 'used') + ' special ' + Player.special[msg.s].name + '</p>');
						setTimeout(function(obj){
							obj.animate({'opacity':0}, 1000, function(){ $(this).remove(); });
						}, 1000, $msg);
						this.player.container.append($msg);
						this.player.use(msg);
					}
				}
			}
			break;
			
		case Message.ROOMS:
			var self = this;
			var $rooms = $('#lobby ul').empty();
			for(var i=0; i < msg.r.length; ++i)
				$rooms.append('<li><a href="#">'+msg.r[i].n + '</a> (' + msg.r[i].p + ')</li>');
			$rooms.delegate('a', 'click', function() {
				for(var pp in self.players) {
					var p = self.players[pp];
					p.container.remove();
					delete self.players[pp];
				}
				self.updatePlayers();
				self.send({t: Message.SET_ROOM, r: $(this).text()});
				$('#lobby').hide();
				$('#ingame').show();
				return false;
			});
			break;
			
		case Message.OPTIONS:
			this.options = msg.o;
			//$('#startbtn').toggle(this.options.admin);
			break;
			
		default:
			alert('Unknown message type: ' + msg.t);
			break;
	}
}
Object.freeze(Game.prototype);
Object.freeze(Game);