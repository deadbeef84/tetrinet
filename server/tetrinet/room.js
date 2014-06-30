var util = require('util'),
	Config = require('./config'),
	Message = require('./message'),
	Player = require('./player');

// class Room extends EventEmitter
var Room = function(name, options) {
	this.name = name;
	this.players = [];
	this.options = options;
	this.suddenDeathTimer = null;
	this.state = Room.STATE_STOPPED;
	
	this.winners = [];
	this.startTime = null;
	this.actions = [];
	this.playerStats = {};
}
util.inherits(Room, process.EventEmitter);

// Events
Room.EVENT_JOIN = 'room-join';
Room.EVENT_PART = 'room-part';
Room.EVENT_START = 'room-start';
Room.EVENT_GAMEOVER = 'room-gameover';

// Game states
Room.STATE_STOPPED = 0;
Room.STATE_STARTING = 1;
Room.STATE_STARTED = 2;

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
	
	this.broadcast(Message.SET_PLAYER, {p: player.getClientInfo(), join: true}, player);
	for(var i=0; i<this.players.length; ++i) {
		if(!this.players[i])
			continue;
		player.send(Message.SET_PLAYER, {p: this.players[i].getClientInfo(), self: (this.players[i] == player)});
	}
	
	this.emit(Room.EVENT_JOIN);
}

// removePlayer(Player player)
Room.prototype.removePlayer = function(player) {
	console.log('removing player...');
	var pos = this.players.indexOf(player);
	if(pos != -1) {
		player.setRoom(null, 0);
		this.players[pos] = null;
		this.broadcast(Message.REMOVE_PLAYER, {id: pos}, player);
		this.emit(Room.EVENT_PART);
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
		if(this.players[i] && this.players[i].isPlaying)
			++numIsPlaying;
	}
	
	this.playerStats[player.index] = {
		identity: player.identity,
		team: player.team,
		place: numIsPlaying + 1,
		time: Date.now() - this.startTime,
		s: s
	};
	this.checkGameState();
}

Room.prototype.playerWon = function(player, s) {
	if(this.winners.indexOf(player) === -1) {
		console.log('invalid winner!?');
		return;
	}
	
	this.playerStats[player.index].s = s; // set stats
	
	// wait for stats from all winners
	for(var i in this.winners) {
		var p = this.winners[i];
		if(!this.playerStats[p.index].s)
			return;
	}

	this.state = Room.STATE_STOPPED;
	this.emit(Room.EVENT_GAMEOVER, this.playerStats, this.actions);
}

// checkGameState()
Room.prototype.checkGameState = function() {
	var room = this;
	var activePlayers = [];
	var activeTeams = [];
	
	if(this.state != Room.STATE_STARTED)
		return;
	
	for(var i=0; i<this.players.length; ++i) {
		if(!this.players[i])
			continue;
		var p = this.players[i];
		if(p.isPlaying) {
			activePlayers.push(p);
			if(activeTeams.indexOf(p.team) == -1)
				activeTeams.push(p.team);
		}
	}
	
	if(activePlayers.length == 1 || (activeTeams.length == 1 && activeTeams[0] != '')) {
		var ids = [];
		this.winners = activePlayers;
		for(var i in activePlayers) {
			var winner = activePlayers[i];
			winner.isPlaying = false;
			ids.push(winner.index);
			this.playerStats[winner.index] = {
				identity: winner.identity,
				team: winner.team,
				place: 1,
				time: Date.now() - this.startTime
			};
		}
		this.broadcast(Message.WINNER, {id: ids});
		
		if(this.suddenDeathTimer) {
			clearInterval(this.suddenDeathTimer);
			this.suddenDeathTimer = null;
		}
	} else if(activePlayers.length == 2 && this.players.length > 2) {
		// start sudden death timer
		if(!this.suddenDeathTimer) {
			this.broadcast(Message.CHAT, {text: '*** STARTING SUDDEN DEATH ***', id: null});
			this.suddenDeathTimer = setInterval(function() {
				room.broadcast(Message.LINES, {n: 1, id: null});
			}, 3000);
		}
	} else if(activePlayers.length == 0) {
		this.state = Room.STATE_STOPPED;
	}
}

Room.prototype.sendSpecial = function(p)
{
	var from = this.players[p.sid];
	var to = this.players[p.id];
	if(from && to)
		this.actions.push({from: from.identity, to: to.identity, s: p.s, time: Date.now() - this.startTime});
}

Room.prototype.startGame = function() {
	if(this.state == Room.STATE_STOPPED) {
		this.state = Room.STATE_STARTING;
		this.broadcast(Message.CHAT, {text: 'Game is about to start!', id: null});
		
		var self = this;
		var count = 0;
		var countdownTimer = setInterval(function() {
			if(count++ >= Config.SERVER_COUNTDOWN) {
				clearInterval(countdownTimer);
				self.doStartGame();
			} else {
				self.broadcast(Message.CHAT, {text: 'Starting in ' + (Config.SERVER_COUNTDOWN - count + 1), id: null});
			}
		}, 1000);
	}
}

// doStartGame()
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
	
	this.state = Room.STATE_STARTED;
	this.winner = null;
	this.startTime = Date.now();
	this.actions = [];
	this.playerStats = {};
	
	this.emit(Room.EVENT_START);
	if(this.numPlayers() > 2)
		this.checkGameState();
}

Room.prototype.getClientInfo = function() {
	return {
		name: this.name,
		options: this.options
	};
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
