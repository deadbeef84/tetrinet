var Message = require('./message'),
	Player = require('./player'),
	Room = require('./room'),
	mysql = require('mysql'),
	util = require('util'),
	openid = require('openid');
	
var relyingParty = new openid.RelyingParty(
    'http://example.com/verify', // Verification URL (yours)
    null, // Realm (optional, specifies realm for OpenID authentication)
    true, // Use stateless verification
    false, // Strict mode
    []); // List of extensions to enable and include

// class Game extends EventEmitter
var Game = function(port) {
	this.rooms = {};
	
	var io = require('socket.io').listen(port, {timeout: 5000});
	io.configure(function(){
		io.set('transports', [
			'websocket'
			,'flashsocket'
			//,'htmlfile'
			//,'xhr-polling'
			//,'jsonp-polling'
		]);
		io.set('origins', 'tetrinet.se:*')
		io.set('log level', 1);
		io.set('authorization', function (handshakeData, callback) {
			// use openid to verify identity
			relyingParty.verifyAssertion(handshakeData.headers.referer, function(err, result) {
				if(err)
					return callback(err);
				if(result.authenticated)
					handshakeData.identity = result.claimedIdentifier;
				callback(null, result.authenticated);
			});
		});
   	});
   	this.io = io;
    
    this.mysql = mysql.createClient({
    	// Use either host and port fom tcp or just port for socket. 
		// host: 'localhost',
		port: '/var/run/mysqld/mysqld.sock',
		database: 'ucms_tetrinet',
		user: 'ucms_tetrinet',
		password: 'dummy'
	});
	
	// Setup rooms
	var room = new Room(this, "Cookies", {width:12, height:24, specials: true});
	this.rooms["Cookies"] = room;
	this.rooms["Pure"] = new Room(this, "Pure", {width:12, height:24, specials: false});
	this.rooms["Short"] = new Room(this, "Short", {width:12, height:12, specials: true});
	this.rooms["Long"] = new Room(this, "Long", {width:12, height:35, specials: true});
	this.rooms["H4CKN1GHT"] = new Room(this, "H4CKN1GHT", {width:12, height:24, specials: true});
    
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

// getRoomInfo()
Game.prototype.getRoomInfo = function() {
	var r = [];
	for(var name in this.rooms) {
		r.push({n: name, p: this.rooms[name].numPlayers()});
	}
	return r;
}

// broadcast(int type, object message, int|array except)
Game.prototype.broadcast = function(type, message, except) {
	message.t = type;
	this.socket.broadcast(JSON.stringify(message), except);
}

// Export this class
module.exports = Game;
