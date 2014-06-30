var Message = require('./message'),
	Player = require('./player'),
	Room = require('./room'),
	Config = require('./config'),
	util = require('util');

if (Config.MYSQL_ENABLED) {
	var mysql = require('mysql');
}

if (Config.OPENID_ENABLED) {
	var openid = require('openid');
	var relyingParty = new openid.RelyingParty(
	    'http://example.com/verify', // Verification URL (yours)
	    null, // Realm (optional, specifies realm for OpenID authentication)
	    true, // Use stateless verification
	    false, // Strict mode
	    []); // List of extensions to enable and include
}

// class Game extends EventEmitter
var Game = function() {
	this.rooms = {};
	
	var io = require('socket.io').listen(Config.PORT, {timeout: 5000});
	io.configure(function(){
		io.set('transports', [
			'websocket'
			,'flashsocket'
			//,'htmlfile'
			//,'xhr-polling'
			//,'jsonp-polling'
		]);
		io.set('origins', Config.HOST + ':*')
		io.set('log level', 1);
		io.set('authorization', function (handshakeData, callback) {
			if (Config.OPENID_ENABLED) {
				// use openid to verify identity
				relyingParty.verifyAssertion(handshakeData.headers.referer, function(err, result) {
					if(err)
						return callback(err);
					if(result.authenticated)
						handshakeData.identity = result.claimedIdentifier;
					callback(null, result.authenticated);
				});
			} else {
				callback(null, true);
			}
		});
   	});
   	this.io = io;
    
    if (Config.MYSQL_ENABLED) {
	    this.mysql = mysql.createClient(Config.MYSQL_LOGIN_DATA);
	}
		
	// Setup rooms
	this.addRoom(new Room("Cookies", {persistent: true, width:12, height:24, specials: true, generator: 1, entrydelay: 150, rotationsystem: 1, tspin: true, holdpiece: true, nextpiece: 3}));
	this.addRoom(new Room("Pure", {persistent: true, width:12, height:24, specials: false, generator: 1, entrydelay: 0, rotationsystem: 1, tspin: true, holdpiece: true, nextpiece: 3}));
	this.addRoom(new Room("Short", {persistent: true, width:12, height:12, specials: true, generator: 1, entrydelay: 150, rotationsystem: 1, tspin: false, holdpiece: false, nextpiece: 1}));
	this.addRoom(new Room("Long", {persistent: true, width:12, height:35, specials: true, generator: 1, entrydelay: 150, rotationsystem: 1, tspin: false, holdpiece: false, nextpiece: 1}));
    
    var self = this;
    this.io.sockets.on('connection', function(client) {
        client.player = new Player(self, client);
		client.on('disconnect', function() {
			console.log('client disconnected: ' + client.id);
			if(client.player.room)
				client.player.room.removePlayer(client.player);
		});
    });
}
util.inherits(Game, process.EventEmitter);

Game.prototype.addRoom = function(room) {
	if(this.rooms[room.name])
		return null;
		
	// Add room
	var self = this;
	this.rooms[room.name] = room;
	this.broadcast(Message.ROOMS, {r: this.getRoomInfo()});
	
	room.on(Room.EVENT_JOIN, function() {
		self.broadcast(Message.ROOMS, {r: self.getRoomInfo()});
	});
	
	room.on(Room.EVENT_PART, function() {
		if(!room.numPlayers() && !room.options.persistent) {
			room.removeAllListeners();
			delete self.rooms[room.name];
		}
		self.broadcast(Message.ROOMS, {r: self.getRoomInfo()});
	});
	
	// Add statistics when game is over
	room.on(Room.EVENT_GAMEOVER, function(results, actions) {
		if(room.name == 'TEST') {
			console.log('Skipping logging of test room.');
			return;
		}
		
	    if (Config.MYSQL_ENABLED) {
			self.mysql.query('INSERT INTO game (date, room) VALUES(NOW(), ?)', [room.name], function(err, info) {
				if(err) {
					console.log('failed to create game in database');
					return false;
				}
				var game_id = info.insertId;
				for(var index in results) {
					var r = results[index];
					self.mysql.query('INSERT INTO game_result (game_id,player_id,team,place,num_keys,num_blocks,num_lines,num_lines_sent,time) VALUES(?,?,?,?,?,?,?,?,?)',
						[game_id, r.identity, r.team, r.place, r.s.keys, r.s.blocks, r.s.lines, r.s.lines_sent, r.time]);
				}
				for(var i = 0; i < actions.length; ++i) {
					var a = actions[i];
					self.mysql.query('INSERT INTO game_action (game_id,player_id,target_player_id,type,time) VALUES(?,?,?,?,?)',
						[game_id, a.from, a.to, a.s, a.time]);
				}
			});
		}
	});
	
	return room;
}

// getRoomInfo()
Game.prototype.getRoomInfo = function() {
	var r = [];
	for(var name in this.rooms) {
		r.push({n: name, p: this.rooms[name].numPlayers()});
	}
	return r;
}

// broadcast(int type, object message)
Game.prototype.broadcast = function(type, message) {
	message.t = type;
	this.io.sockets.send(JSON.stringify(message));
}

// Export this class
module.exports = Game;
