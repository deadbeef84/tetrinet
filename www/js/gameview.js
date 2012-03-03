function GameView(game) {
	this.game = game;
	this.keypressTimers = [];
	this.keypressActive = [];
	this.target = 0;
	this.targetList = [];
}

GameView.prototype.init = function() {
	var self = this;
	var game = this.game;
	var keydownAction = function(keycode) {
		
		game.keyCount++;
	
		switch (keycode) {
			case Settings.keymap.left:			game.moveLeft(); break;
			case Settings.keymap.right:			game.moveRight(); break;
			case Settings.keymap.down:			game.moveDown(); break;
			case Settings.keymap.drop:			game.drop(); break;
			case Settings.keymap.soft_drop:		game.softDrop(); break;
			case Settings.keymap.rotate_cw:		game.rotateClockwise(); break;
			case Settings.keymap.rotate_ccw:	game.rotateCounterClockwise(); break;
			case Settings.keymap.inventory_1:	game.use(0); break;
			case Settings.keymap.inventory_2:	game.use(1); break;
			case Settings.keymap.inventory_3:	game.use(2); break;
			case Settings.keymap.inventory_4:	game.use(3); break;
			case Settings.keymap.inventory_5:	game.use(4); break;
			case Settings.keymap.inventory_6:	game.use(5); break;
			case Settings.keymap.inventory_7:	game.use(6); break;
			case Settings.keymap.inventory_8:	game.use(7); break;
			case Settings.keymap.inventory_9:	game.use(8); break;
			case Settings.keymap.inventory_self:			game.use(game.player.id); break;
			case Settings.keymap.inventory_target_left:		self.cycleTarget(-1); break;
			case Settings.keymap.inventory_target_right:	self.cycleTarget(1); break;
			case Settings.keymap.inventory_target_send:		game.use(game.target); break;
			case Settings.keymap.hold:
				if (game.options.holdpiece)
					game.player.hold();
				break;
			case Settings.keymap.talk:
				$('#message').focus();
				var onSubmit = function() { $('#message').blur(); };
				$('#chatbox form').one('submit', onSubmit);
				$('#message').on('blur', function(){ $('#chatbox form').off('submit', onSubmit); });
				break;
			default:
				// unrecognized key
				return;
		}
	}
	
	$(document).keydown(function(e) {
		
		if (document.activeElement && $(document.activeElement).filter(':text').length)
			return;
		
		var repeatedKeys = [
			Settings.keymap.left,
			Settings.keymap.right,
			Settings.keymap.down
		];

		if (game.player && game.player.isPlaying && !self.keypressActive[e.which]) {
			
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
	});
	
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
		if(game.player && game.player.isPlaying) {
			if(e.type === 'touchend') {
				if (event.targetTouches.length == 0 && event.changedTouches.length == 1) {
					var touch = event.changedTouches[0];
					var dt = (Date.now() - startTime) / 1000.0;
					var dx = touch.screenX - startPos.x;
					var dy = touch.screenY - startPos.y;
					var vx = dx / dt;
					var vy = dy / dt;
					if(dy > 50 && vy > 300) {
						game.player.move(-mx, 0, 0, false);
						game.player.falldown(true);
					} else if(dt < 0.2 && dx < 20 && dy < 20) {
						game.player.move(0, 0, 1, false);
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
			if (game.player && game.player.isPlaying) {
				var dx = Math.floor((touch.screenX - relPos.x) / sensitivity);
				var dy = Math.floor((touch.screenY - relPos.y) / sensitivity);
				if(dx) {
					while(dx && game.player.move(dx, 0, 0, false))
						dx += dx > 0 ? -1 : 1;
					mx += dx;
					relPos.x += dx * sensitivity;
				}
				if(dy > 0) {
					game.player.move(0, dy, 0, false);
					relPos.y += dx * sensitivity;
				}
				return false;
			}
		}
	});
	
	$('#startbtn button').click(function() {
		game.send({t:Message.START});
	});
	
	$('#team').change(function() {
		var team = $(this).val();
		game.send({t:Message.SET_TEAM, team: team});
	});
	
	$('#lobby ul').delegate('a', 'click', function() {
		game.send({t: Message.SET_ROOM, r: $(this).text()});
		return false;
	});
	
	$('#leave_room').click(function() {
		game.send({t: Message.SET_ROOM, r: ''});
		return false;
	});
	
	$('#chatbox form').submit(function() {
		var msg = $('#message').val();
		$('#message').val('');
		if(game.player && game.player.isPlaying) {
			var input = true;
			if(msg == 'LEFT')
				game.player.move(-1,0,0,false);
			else if(msg == 'RIGHT')
				game.player.move(1,0,0,false);
			else if(msg == 'DROP') // space
				game.player.falldown(true);
			else if(msg == 'ROTATE')
				game.player.move(0,0,1,false);
			else
				input = false;
			if(input) {
				return false;
			}
		}
		game.chat('You: ' + msg);
		game.send({t:Message.CHAT, text: msg});
		return false;
	});
	
	// settings dialog
	
	var initSettings = function() {
		$('#settings_name').val(Settings.name);
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
		$('#settings_buffersize').val(Settings.log.buffer_size);
		if (Settings.log.autoscroll)
			$('#settings_logautoscroll').attr('checked', 'checked');
		else
			$('#settings_logautoscroll').removeAttr('checked');
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
			game.player.name = newName;
			game.updatePlayers();
			game.send({t:Message.NAME, id:game.player.id, name:newName});
		}
		Settings.misc.ghost_block = $('#settings_ghostblock').is(':checked');
		Settings.misc.attack_notifications = $('#settings_attacknotifications').is(':checked');
		Settings.misc.keypress_repeat_delay = Math.max(1, parseInt($('#settings_keyrepeatdelay').val()));
		Settings.misc.keypress_repeat_interval = Math.max(1, parseInt($('#settings_keyrepeatinterval').val()));
		Settings.log.buffer_size = Math.max(1, parseInt($('#settings_buffersize').val()));
		Settings.log.autoscroll = $('#settings_logautoscroll').is(':checked');
		Bw.setCookie('settings_name', Settings.name);
		Bw.setCookie('settings_misc', Settings.misc);
		Bw.setCookie('settings_keymap', Settings.keymap);
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
		Bw.setCookie('settings_log', Settings.log);
		
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
		if (Settings.log.autoscroll)
			c[0].scrollTop = c[0].scrollHeight;
		Settings.log.selected_filter = index;
		Bw.setCookie('settings_log', Settings.log);
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
		Bw.setCookie('settings_log', Settings.log);
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
		game.send(obj);
		$.BW.catbox.close();
		return false;
	});
	$('#createroom_popup .cancel').click($.BW.catbox.close);
}

GameView.prototype.cycleTarget = function(dir) {
	var targetIndex = this.targetList.indexOf(this.target);
	if (targetIndex > -1) {
		do {
			targetIndex += dir;
			if (targetIndex < 0)
				targetIndex += this.targetList.length;
			if (targetIndex >= this.targetList.length)
				targetIndex -= this.targetList.length;
		} while (!this.game.players[this.targetList[targetIndex]].isPlaying);
		this.setTarget(this.targetList[targetIndex]);
	} else {
		this.setTarget(this.game.player.id);
	}
}

GameView.prototype.setTarget = function(id) {
	this.game.players[this.target].container.removeClass('target');
	this.target = id;
	this.game.players[this.target].container.addClass('target');
}