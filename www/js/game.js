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
	this.keypressTimers = [];
	this.keypressActive = [];
	this.lastMoveRotate = false;
	this.lastDropTspin = false;
	this.backToBack = false;
	
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
	
	var keydownAction = function(keycode) {
		
		self.keyCount++;
	
		switch (keycode) {
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
			case Settings.keymap.hold:
				if (self.options.holdpiece)
					self.player.hold();
				break;
			default:
				// unrecognized key
				return;
		}
		if (keycode == Settings.keymap.left || keycode == Settings.keymap.right)
			self.lastMoveRotate = false;
		if (keycode == Settings.keymap.rotate_cw || keycode == Settings.keymap.rotate_ccw)
			self.lastMoveRotate = true;
	}
	
	var keydownHandler = function(e) {
		
		if (document.activeElement && $(document.activeElement).filter(':text').length)
			return;
		
		var repeatedKeys = [
			Settings.keymap.left,
			Settings.keymap.right,
			Settings.keymap.down
		];

		if (self.player && self.player.isPlaying && !self.keypressActive[e.which]) {
			
			keydownAction(e.which);
			self.keypressActive[e.which] = true;

			if (repeatedKeys.indexOf(e.which) != -1) {
				self.keypressTimers[e.which] = setTimeout(function() {
					keydownAction(e.which);
					self.keypressTimers[e.which] = setInterval(function() {
						keydownAction(e.which);
					}, Settings.misc.keypress_repeat_interval);
				}, Settings.misc.keypress_repeat_delay);
			}
			return false;
		}
	};
	
	$(document).keydown(keydownHandler);
	$(document).keyup(function(e){
		self.keypressActive[e.which] = false;
		if (self.keypressTimers[e.which]) {
			clearTimeout(self.keypressTimers[e.which]);
			delete self.keypressTimers[e.which];
		}
	});
	
	// touch controls
	var startTime = Date.now();
	var startPos = {x:0,y:0};
	var relPos = {x:0,y:0};
	var mx = 0;
	$(document).on('touchstart touchend', function(e) {
		var event = e.originalEvent;
		if (event.targetTouches.length == 1) {
			startTime = Date.now();
			var touch = event.targetTouches[0];
			relPos.x = startPos.x = touch.screenX;
			relPos.y = startPos.y = touch.screenY;
			mx = 0;
		}
		if(self.player && self.player.isPlaying) {
			if(e.type === 'touchend') {
				if (event.targetTouches.length == 0 && event.changedTouches.length == 1) {
					var touch = event.changedTouches[0];
					var dt = (Date.now() - startTime) / 1000.0;
					var dx = touch.screenX - startPos.x;
					var dy = touch.screenY - startPos.y;
					var vx = dx / dt;
					var vy = dy / dt;
					if(dy > 50 && vy > 300) {
						self.player.move(-mx, 0, 0, false);
						self.player.falldown(true);
					} else if(dt < 0.2 && dx < 20 && dy < 20) {
						self.player.move(0, 0, 1, false);
					}
				}
			}
			return false;
		}
	});
	$(document).on('touchmove', function(e) {
		var event = e.originalEvent;
		if (event.targetTouches.length == 1) {
			var touch = event.targetTouches[0];
			var sensitivity = 20;
			if (self.player && self.player.isPlaying) {
				var dx = Math.floor((touch.screenX - relPos.x) / sensitivity);
				var dy = Math.floor((touch.screenY - relPos.y) / sensitivity);
				if(dx) {
					while(dx && self.player.move(dx, 0, 0, false))
						dx += dx > 0 ? -1 : 1;
					mx += dx;
					relPos.x += dx * sensitivity;
				}
				if(dy > 0) {
					self.player.move(0, dy, 0, false);
					relPos.y += dx * sensitivity;
				}
				return false;
			}
		}
	});
	
	// touch controls
	var startTime = Date.now();
	var startPos = {x:0,y:0};
	var relPos = {x:0,y:0};
	var mx = 0;
	$(document).on('touchstart touchend', function(e) {
		var event = e.originalEvent;
		if (event.targetTouches.length == 1) {
			startTime = Date.now();
			var touch = event.targetTouches[0];
			relPos.x = startPos.x = touch.screenX;
			relPos.y = startPos.y = touch.screenY;
			mx = 0;
		}
		if(self.player && self.player.isPlaying) {
			if(e.type === 'touchend') {
				if (event.targetTouches.length == 0 && event.changedTouches.length == 1) {
					var touch = event.changedTouches[0];
					var dt = (Date.now() - startTime) / 1000.0;
					var dx = touch.screenX - startPos.x;
					var dy = touch.screenY - startPos.y;
					var vx = dx / dt;
					var vy = dy / dt;
					if(dy > 50 && vy > 300) {
						self.player.move(-mx, 0, 0, false);
						self.player.falldown(true);
					} else if(dt < 0.2 && dx < 20 && dy < 20) {
						self.player.move(0, 0, 1, false);
					}
				}
			}
			return false;
		}
	});
	$(document).on('touchmove', function(e) {
		var event = e.originalEvent;
		if (event.targetTouches.length == 1) {
			var touch = event.targetTouches[0];
			var sensitivity = 20;
			if (self.player && self.player.isPlaying) {
				var dx = Math.floor((touch.screenX - relPos.x) / sensitivity);
				var dy = Math.floor((touch.screenY - relPos.y) / sensitivity);
				if(dx) {
					while(dx && self.player.move(dx, 0, 0, false))
						dx += dx > 0 ? -1 : 1;
					mx += dx;
					relPos.x += dx * sensitivity;
				}
				if(dy > 0) {
					self.player.move(0, dy, 0, false);
					relPos.y += dx * sensitivity;
				}
				return false;
			}
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
		$('#settings_keyrepeatdelay').val(Settings.misc.keypress_repeat_delay);
		$('#settings_keyrepeatinterval').val(Settings.misc.keypress_repeat_interval);
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
		Settings.misc.keypress_repeat_delay = Math.max(1, parseInt($('#settings_keyrepeatdelay').val()));
		Settings.misc.keypress_repeat_interval = Math.max(1, parseInt($('#settings_keyrepeatinterval').val()));
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
		var filters = [];
		$.merge(filters, Game.LOG_DEFAULT_FILTER_TABS);
		$.merge(filters, Settings.log.custom_filters);
		$.each(filters, addFilter);
		var selected = $('#gamelogfilters > li:eq(' + Settings.log.selected_filter + '):not(#gamelogfilters_add)');
		if (!selected.length)
			selected = $('#gamelogfilters > li:first:not(#gamelogfilters_add)');
		selected.click();
	};
	
	var initFilterSettings = function(index) {
		
		var name = Settings.log.custom_filters[index] ? Settings.log.custom_filters[index].name : "New filter";
		var selectedFilters = Settings.log.custom_filters[index] ? Settings.log.custom_filters[index].classes : Game.LOG_FILTERS;
		
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
		Settings.log.custom_filters.splice(tabIndex - Game.LOG_DEFAULT_FILTER_TABS.length, 1);
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
		Settings.log.custom_filters.push(newFilter);
		self.setCookie('settings_log', Settings.log);
		addFilter(Settings.log.custom_filters.length - 1 + Game.LOG_DEFAULT_FILTER_TABS.length, newFilter).click();
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
Game.LOG_DEFAULT_FILTER_TABS = [{
	title: 'All',
	classes: ['log-status', 'log-lines', 'log-special'],
	closeButton: false
}];

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
			var container = $(
				'<div class="player">'+
					'<h2>Player</h2>'+
					'<div class="board"></div>'+
					'<div class="nextpiece"></div>'+
					'<div class="holdpiece"></div>'+
					'<div class="inventory"></div>'+
				'</div>').appendTo('#gamearea');
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
					// clear all keypress timers
					$.each(self.keypressTimers, function(i, obj) {
						clearTimeout(obj);
						delete self.keypressTimers[i];
					});
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
					self.linesRemoved += l;
					self.backToBack = self.lastDropTspin;
				});
				p.on(Player.EVENT_DROP, function() {
					self.lastMoveRotate = false;
				});
				p.setOptions(this.options);
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
				p.removeAllListeners();
				p.container.remove();
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
