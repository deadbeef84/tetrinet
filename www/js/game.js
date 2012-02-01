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
	this.target = 0;
	this.targetList = [];
	this.attackNotifierSlots = [];
	
	var self = this;
	
	if (name) {
	
		this.socket = io.connect('//'+location.hostname+':'+port);
		
		this.socket.on('error', function(event) {
			console.log(event);
		});
		this.socket.on('connect', function(event) {
			// send name
			self.chat('You are now connected');
			self.send({t: Message.JOIN, name:name});
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
		
		this.handleMessage({ t:Message.SET_ROOM, r: {name: 'singleplayer', options:{height:24, width:12, specials: false} } });
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
					self.cycleTarget(-1);
					break;
				case Settings.keymap.inventory_target_right:
					self.cycleTarget(1);
					break;
				case Settings.keymap.inventory_target_send:
					self.use(self.target);
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
	
	$('#team').change(function() {
		var team = $(this).val();
		self.send({t:Message.SET_TEAM, team: team});
	});
	
	$('#lobby ul').delegate('a', 'click', function() {
		self.send({t: Message.SET_ROOM, r: $(this).text()});
		return false;
	});
	
	$('#leave_room').click(function() {
		self.send({t: Message.SET_ROOM, r: ''});
		return false;
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
	
	// settings dialog
	
	var initSettings = function() {
		$('#settings_name').val(Settings.name);
		$('#settings_buffersize').val(Settings.log.buffer_size);
		if (Settings.misc.ghost_block)
			$('#settings_ghostblock').attr('checked', 'checked');
		else
			$('#settings_ghostblock').removeAttr('checked');
		if (Settings.misc.attack_notifications)
			$('#settings_attacknotifications').attr('checked', 'checked');
		else
			$('#settings_attacknotifications').removeAttr('checked');
		$('#settings_keys input').each(function(index) {
			$(this).val(getCharFromKeyCode(Settings.keymap[$(this).attr('name')]));
			$(this).data('keycode', Settings.keymap[$(this).attr('name')]);
		});
	};
	$('#settings_show').show().click(function() {
		initSettings();
		$('#settings_popup').catbox('Settings');
		return false;
	});
	$('#settings_cancel').click($.BW.catbox.close);
	
	$('#settings').submit(function(){
		$('#settings_keys input').each(function() {
			Settings.keymap[$(this).attr('name')] = $(this).data('keycode');
		});
		var newName = $('#settings_name').val();
		if (newName != Settings.name) {
			Settings.name = newName;
			self.player.name = newName;
			self.updatePlayers();
			self.send({t:Message.NAME, id:self.player.id, name:newName});
		}
		Settings.misc.ghost_block = $('#settings_ghostblock').is(':checked');
		Settings.misc.attack_notifications = $('#settings_attacknotifications').is(':checked');
		Settings.log.buffer_size = Math.max(1, parseInt($('#settings_buffersize').val()));
		self.setCookie('settings_name', Settings.name);
		self.setCookie('settings_misc', Settings.misc);
		self.setCookie('settings_keymap', Settings.keymap);
		$.BW.catbox.close();
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
	
	// log filtering
	
	var addFilter = function(index, obj) {
		var listItem = $('<li>' + obj.title + '</li>');
		if (obj.closeButton)
			listItem.append($('<a href="" class="gamelogfilters_close">X</a>'));
		$('#gamelogfilters_add').before(listItem);
		$('#gamelog').append($('<div class="' + obj.classes.join(' ') + '"></div>'));
		return listItem;
	};
	
	var initFilters = function() {
		$.each(Settings.log.filters, addFilter);
		$('#gamelogfilters > li:not(#gamelogfilters_add):eq(' + Settings.log.selected_filter + ')').click();
	};
	
	var initFilterSettings = function(index) {
		
		var name = Settings.log.filters[index] ? Settings.log.filters[index].name : "New filter";
		var selectedFilters = Settings.log.filters[index] ? Settings.log.filters[index].classes : Game.LOG_FILTERS;
		
		$('#filtersettings_name').val(name);
		$('#filtersettings_filters').empty();
		
		$.each(Game.LOG_FILTERS, function(key, obj){
			var option = $('<option value="' + obj + '">' +  key + '</option>');
			if (selectedFilters[key] != null)
				option.attr('selected', 'selected');
			$('#filtersettings_filters').append(option);
		});
	};
	
	$('#gamelogfilters').on('click', 'a.gamelogfilters_close', function() {
		
		var tabItem = $(this).parent();
		var tabIndex = tabItem.index();
		
		tabItem.remove();
		$('#gamelog > div:eq(' + tabIndex + ')').remove();
		Settings.log.filters.splice(tabIndex, 1);
		self.setCookie('settings_log', Settings.log);
		
		var tabs = $('#gamelogfilters > li:not(#gamelogfilters_add)');
		var newTabIndex = Math.max(0, Math.min(tabs.length - 1, tabIndex));
		$('#gamelogfilters > li:eq(' + newTabIndex + ')').click();
		return false;
	});
	
	$('#gamelogfilters').on('click', 'li:not(#gamelogfilters_add)', function(){
		var index = $(this).index();
		$('#gamelogfilters > li').removeClass('active');
		$(this).removeClass('updated').addClass('active');
		$('#gamelog > div').hide();
		var c = $('#gamelog > div:eq(' + index + ')');
		c.show();
		c[0].scrollTop = c[0].scrollHeight;
		Settings.log.selected_filter = index;
		self.setCookie('settings_log', Settings.log);
	});

	$('#gamelogfilters_add').show().click(function() {
		initFilterSettings();
		$('#filtersettings_popup').catbox('New filter');
		return false;
	});
	
	$('#filtersettings').submit(function(){
		var title = $('#filtersettings_name').val();
		var selectedFilters = [];
		$('#filtersettings_filters > option:selected').each(function(){
			selectedFilters.push($(this).val());
		});
		var newFilter = {
			'title': title,
			'classes': selectedFilters,
			'closeButton': true
		};
		Settings.log.filters.push(newFilter);
		self.setCookie('settings_log', Settings.log);
		addFilter(Settings.log.filters.length - 1, newFilter).click();
		$.BW.catbox.close();
		return false;
	});
	
	$('#filtersettings_cancel').click($.BW.catbox.close);
	
	initFilters();
	
	// Create room
	
	$('#createroom_show').click(function() {
		$('#createroom_popup').catbox('Create room');
		return false;
	});
	$('#createroom_popup form').submit(function(){
		var data = $(this).serializeArray();
		var obj = {};
		for(var p in data)
			obj[data[p].name] = data[p].value;
		obj.t = Message.CREATE_ROOM;
		self.send(obj);
		$.BW.catbox.close();
		return false;
	});
	$('#createroom_popup .cancel').click($.BW.catbox.close);
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

Game.prototype.setCookie = function(name, data) {
	var date = new Date();
	var options = { expiresAt: new Date(date.getFullYear()+1, date.getMonth(), date.getDay()) };
	$.cookies.set(name, data, options);
}

Game.prototype.cycleTarget = function(dir) {
	var targetIndex = this.targetList.indexOf(this.target);
	if (targetIndex > -1) {
		do {
			targetIndex += dir;
			if (targetIndex < 0)
				targetIndex += this.targetList.length;
			if (targetIndex >= this.targetList.length)
				targetIndex -= this.targetList.length;
		} while (!this.players[this.targetList[targetIndex]].isPlaying);
		this.setTarget(this.targetList[targetIndex]);
	} else {
		this.setTarget(this.player.id);
	}
}

Game.prototype.setTarget = function(id) {
	this.players[this.target].container.removeClass('target');
	this.target = id;
	this.players[this.target].container.addClass('target');
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

Game.prototype.removePlayer = function(index) {
	var p = this.players[index];
	if (this.target == p.id && this.player.isPlaying)
		this.cycleTarget(-1);
	var targetIndex = this.targetList.indexOf(p.id);
	if (targetIndex > -1)
		this.targetList.splice(targetIndex, 1);
	p.container.remove();
	delete this.players[index];
	this.updatePlayers();
}

Game.prototype.updatePlayers = function() {
	for(var pp in this.players) {
		var p = this.players[pp];
		p.container.find('h2')
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
	//console.log(msg);
	var self = this;
	switch(msg.t) {
		case Message.SET_PLAYER:
			var p;
			var container = $('<div class="player"><h2>Player</h2><div class="board"></div><div class="nextpiece"></div><div class="inventory"></div></div>').appendTo('#gamearea');
			if (msg.self) {
				container.prependTo('#gamearea');
				container.addClass('self');
				this.player = p = new Player( container );
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
					$('.player').removeClass('target');
				});
				p.on(Board.EVENT_LINES, function(l) {
					self.linesRemoved += l;
					if(l > 1) {
						var linesToAdd = (l == 4 ? l : (l-1));
						self.linesSent += linesToAdd;
						self.gameLog('<em>' + htmlspecialchars(self.player.name) + '</em> added <strong>' + linesToAdd + '</strong> lines to all', [ Game.LOG_LINES ]);
						self.send({t: Message.LINES, n: linesToAdd});
					}
				});
				p.specials = this.options.specials;
			} else {
				p = new Board(container);
			}
			p.setSize(this.options.width, this.options.height);
			p.name = msg.p.name;
			p.team = msg.p.team;
			p.container = container;
			p.id = msg.p.index;
			if(msg.join)
				this.gameLog('<em class="status">' + htmlspecialchars(p.name) + ' joined the game</em>', Game.LOG_STATUS);
			if(this.players[p.id])
				this.removePlayer(p.id);
			this.players[p.id] = p;
			this.updatePlayers();
			if (msg.self)
				this.targetList.unshift(p.id);
			else
				this.targetList.push(p.id);
			break;
			
		case Message.GAMEOVER:
			var p = this.players[msg.id];
			p.isPlaying = false;
			this.gameLog(htmlspecialchars(p.name) + ' is dead.', Game.LOG_STATUS);
			p.container.addClass('gameover');
			if (this.target == p.id && p.id != this.player.id)
				this.cycleTarget(-1);
			break;
			
		case Message.WINNER:
			for(var i in msg.id) {
				var p = this.players[msg.id[i]];
				p.isPlaying = false;
				p.container.addClass('winner');
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
			this.setTarget(this.player.id);
			break;
			
		case Message.UPDATE_BOARD:
			var p = this.players[msg.id];
			p.data = msg.d;
			p.render();
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
				this.gameLog('<em class="'+(msg.sid==this.player.id?'self':'other')+'">' + sourcePlayer.name + '</em> ' + (msg.reflect ? 'reflected' : 'used') + ' special <strong>' + Player.special[msg.s].name + '</strong> on <em class="'+(msg.id==this.player.id?'self':'other')+'">' + targetPlayer.name + '</em>', logClass);
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
							var $msg = $('<p class="attack">' + sourcePlayer.name + ' ' + (msg.reflect ? 'reflected' : 'used') + ' special ' + Player.special[msg.s].name + '</p>');
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
							this.player.container.append($msg);
						}
						this.player.use(msg);
					}
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
				p.container.remove();
			}
			this.players = {};
			this.updatePlayers();
			this.team = '';
			$('#team').val(this.team);
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