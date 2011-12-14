var util = require('util'),
	Message = require('./message'),
	Player = require('./player');

// class Room extends EventEmitter
var Room = function(game, name, options) {
	this.game = game;
	this.name = name;
	this.players = [];
	this.options = options;
	this.suddenDeathTimer = null;
	this.state = 0; // 0 = not started, 1 = about to start, 2 = started
	
	this.winner = null;
	this.startTime = null;
	this.actions = [];
	this.playerStats = {};
}
util.inherits(Room, process.EventEmitter);

// addPlayer(Player player)
Room.prototype.addPlayer = function(player) {
	var index = -1;
	for(var i=0; i<this.players.length; ++i) {
		if(!this.players[i]) {
			index = i;
			break;
		}
	}
	
	if(index == -1) {
		// add new player
		index = this.players.length;
		this.players.push(player);
	} else {
		// reuse empty slot
		this.players[index] = player;
	}
	
	player.setRoom(this, index);
	
	this.broadcast(Message.SET_PLAYER, {p: player.getClientInfo()}, player);
	player.send(Message.OPTIONS, {o: this.options});
	for(var i=0; i<this.players.length; ++i) {
		if(!this.players[i])
			continue;
		player.send(Message.SET_PLAYER, {p: this.players[i].getClientInfo(), self: (this.players[i] == player)});
	}
	
}

// removePlayer(Player player)
Room.prototype.removePlayer = function(player) {
	console.log('removing player...');
	var pos = this.players.indexOf(player);
	if(pos != -1) {
		//var p = this.players.splice(pos, 1)[0];
		this.players[pos] = null;
		this.broadcast(Message.REMOVE_PLAYER, {id: pos});
	} else {
		console.log('warning, player not found: ' + player.name);
	}
	this.checkGameState();
}

Room.prototype.numPlayers = function() {
	var c = 0;
	for(var i=0; i<this.players.length; ++i) {
		if(this.players[i])
			++c;
	}
	return c;
}

Room.prototype.playerDied = function(player, s) {
	this.broadcast(Message.GAMEOVER, {id: player.index});
	
	var numIsPlaying = 0;
	for(var i=0; i<this.players.length; ++i) {
		if(!this.players[i])
			continue;
		if(this.players[i].isPlaying)
			++numIsPlaying;
	}
	
	this.playerStats[player.index] = {
		identity: player.client.handshake.identity,
		place: numIsPlaying + 1,
		time: Date.now() - this.startTime,
		s: s
	};
	this.checkGameState();
}

Room.prototype.playerWon = function(player, s) {
	if(player !== this.winner) {
		console.log('invalid winner!?');
		return;
	}
	
	this.state = 0; // not playing
	this.playerStats[player.index].s = s; // set stats
	
	if(this.name == 'TEST') {
		console.log('Skipping logging of test room.');
		return;
	}
	
	var results = this.playerStats;
	var actions = this.actions;
	var self = this;
	self.game.mysql.query('INSERT INTO game (date) VALUES(NOW())', function(err, info) {
		if(err) {
			console.log('failed to create game in database');
			return false;
		}
		var game_id = info.insertId;
		for(var index in results) {
			var r = results[index];
			self.game.mysql.query('INSERT INTO game_result (game_id,player_id,place,num_keys,num_blocks,num_lines,num_lines_sent,time) VALUES(?,?,?,?,?,?,?,?)',
				[game_id, r.identity, r.place, r.s.keys, r.s.blocks, r.s.lines, r.s.lines_sent, r.time]);
		}
		for(var i = 0; i < actions.length; ++i) {
			var a = actions[i];
			self.game.mysql.query('INSERT INTO game_action (game_id,player_id,target_player_id,type,time) VALUES(?,?,?,?,?)',
				[game_id, a.from, a.to, a.s, a.time]);
		}
	});
}

// checkGameState()
Room.prototype.checkGameState = function() {
	var room = this;
	var numIsPlaying = 0;
	var winner;
	
	if(this.state != 2)
		return;
	
	for(var i=0; i<this.players.length; ++i) {
		if(!this.players[i])
			continue;
		if(this.players[i].isPlaying) {
			++numIsPlaying;
			winner = this.players[i];
		}
	}
	if(numIsPlaying == 1) {
		this.winner = winner;
		this.playerStats[winner.index] = {
			identity: winner.client.handshake.identity,
			place: numIsPlaying,
			time: Date.now() - this.startTime
		};
		this.broadcast(Message.WINNER, {id: winner.index});
		winner.isPlaying = false;
		
		if(this.suddenDeathTimer) {
			clearInterval(this.suddenDeathTimer);
			this.suddenDeathTimer = null;
		}
	} else if(numIsPlaying == 2) {
		// start sudden death timer
		if(!this.suddenDeathTimer) {
			this.broadcast(Message.CHAT, {text: '*** STARTING SUDDEN DEATH ***', id: null});
			this.suddenDeathTimer = setInterval(function() {
				room.broadcast(Message.LINES, {n: 1, id: null});
			}, 3000);
		}
	} else if(numIsPlaying == 0) {
		this.state = 0;
	}
}

Room.prototype.sendSpecial = function(p)
{
	var from = this.players[p.sid];
	var to = this.players[p.id];
	if(from && to)
		this.actions.push({from: from.client.handshake.identity, to: to.client.handshake.identity, s: p.s, time: Date.now() - this.startTime});
}

Room.prototype.startGame = function() {
	if(this.state == 0) {
		this.state = 1;
		this.broadcast(Message.CHAT, {text: 'Game is about to start!', id: null});
		
		var self = this;
		var count = 0;
		var countdownTimer = setInterval(function() {
			if(++count == 6) {
				clearInterval(countdownTimer);
				self.doStartGame();
			} else {
				self.broadcast(Message.CHAT, {text: 'Starting in ' + (6 - count), id: null});
			}
		}, 1000);
	}
}

// startGame()
Room.prototype.doStartGame = function() {
	if(this.suddenDeathTimer) {
		clearInterval(this.suddenDeathTimer);
		this.suddenDeathTimer = null;
	}
	
	var seed = Math.floor(Math.random() * 1000000000);
	for(var i=0; i<this.players.length; ++i) {
		if(!this.players[i])
			continue;
		// Mark all players as playing
		this.players[i].isPlaying = true;
		// Start game
		this.players[i].send(Message.START, {seed: seed});
	}
	this.broadcast(Message.CHAT, {text: 'Go!!!', id: null});
	
	this.state = 2;
	this.winner = null;
	this.startTime = Date.now();
	this.actions = [];
	this.playerStats = {};
}

// broadcast(int type, object message, int except)
Room.prototype.broadcast = function(type, message, except) {
	message.t = type;
	for(var i=0; i<this.players.length; ++i) {
		var player = this.players[i];
		if(!player)
			continue;
		if(player !== except)
			player.client.send(JSON.stringify(message));
	}
}

// Export this class
module.exports = Room;