var util = require('util'),
	Message = require('./message');

// class Player extends EventEmitter
var Player = function(game, client) {
	this.game = game;
	this.client = client;
	this.name = "client_" + client.id;
	this.isPlaying = false;
	this.room = null;
	this.index = 0;
	
	var player = this;
	this.client.on('message', function(m) {
		player.handleMessage(JSON.parse(m));
	});
}
util.inherits(Player, process.EventEmitter);

// Events
Player.EVENT_JOIN = 'player-join';
Player.EVENT_GAMEOVER = 'player-gameover';

// handleMessage(object p)
Player.prototype.handleMessage = function(p) {
	console.log('got message: ' + p.t);
	switch(p.t) {
		case Message.PING:
			break;
			
		case Message.JOIN:
			this.name = p.name || "Error";
			
			var id = this.client.handshake.identity;
			this.game.mysql.query('INSERT INTO player (player_id,name) VALUES(?, ?) ON DUPLICATE KEY UPDATE name=?', [id, this.name, this.name]);
			
			this.emit(Player.EVENT_JOIN);
			this.send(Message.ROOMS, {r: this.game.getRoomInfo()});
			break;
			
		case Message.START:
			console.log('Starting game!');
			if(this.room)
				this.room.startGame();
			break;
			
		case Message.UPDATE_BOARD:
			if(this.room)
				this.room.broadcast(Message.UPDATE_BOARD, {id: this.index, d: p.d}, this );
			break;
			
		case Message.GAMEOVER:
			this.isPlaying = false;
			if(this.room)
				this.room.playerDied(this, p.s);
			break;
			
		case Message.WINNER:
			if(this.room)
				this.room.playerWon(this, p.s);
			break;
			
		case Message.LINES:
			if(this.room)
				this.room.broadcast(Message.LINES, {n: p.n, id: this.index}, this);
			break;
			
		case Message.CHAT:
			if(this.room)
				this.room.broadcast(Message.CHAT, {text: p.text, id: this.index}, this);
			break;
		
		case Message.SPECIAL:
			p.sid = this.index;
			if(this.room) {			
				this.room.broadcast(Message.SPECIAL, p, this);
				this.room.sendSpecial(p);
			}
			break;
			
		case Message.SET_ROOM:
			var room = this.game.rooms[p.r];
			if(room) {
				if(this.room)
					this.room.removePlayer(this);
				room.addPlayer(this);
			}
			break;
			
		default:
			console.log('Unknown packet type');
	}
}

Player.prototype.getClientInfo = function() {
	return {
		name: this.name,
		index: this.index,
	};
}

// setRoom(Room room)
Player.prototype.setRoom = function(room, index) {
	this.room = room;
	this.index = index;
}

// send(type, object message)
Player.prototype.send = function(type, message) {
	message.t = type;
	this.client.send(JSON.stringify(message));
}

// Export this class
module.exports = Player;
