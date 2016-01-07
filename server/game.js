var Message = require('./message'),
  Player = require('./player'),
  Room = require('./room'),
  util = require('util');

// class Game extends EventEmitter
var Game = function(io) {
  this.rooms = {};
  this.io = io;

  // Setup rooms
  this.addRoom(new Room("Cookies", {persistent: true, width:12, height:24, specials: true, generator: 1, entrydelay: 150, rotationsystem: 1, tspin: true, holdpiece: true, nextpiece: 3}));
  this.addRoom(new Room("Pure", {persistent: true, width:12, height:24, specials: false, generator: 1, entrydelay: 0, rotationsystem: 1, tspin: true, holdpiece: true, nextpiece: 3}));
  this.addRoom(new Room("Short", {persistent: true, width:12, height:12, specials: true, generator: 1, entrydelay: 150, rotationsystem: 1, tspin: false, holdpiece: false, nextpiece: 1}));
  this.addRoom(new Room("Long", {persistent: true, width:12, height:35, specials: true, generator: 1, entrydelay: 150, rotationsystem: 1, tspin: false, holdpiece: false, nextpiece: 1}));

  // Handle connect/disconnect
  var self = this;
  this.io.on('connection', function(client) {
    console.log('client connected: ' + client.id);
    client.player = new Player(self, client);
    self.addPlayer(client.player);
    client.on('disconnect', function() {
      console.log('client disconnected: ' + client.id);
      self.removePlayer(client.player);

    });
  });
}
util.inherits(Game, process.EventEmitter);

Game.EVENT_PLAYER_CONNECTED = 'game-player-connected';
Game.EVENT_PLAYER_DISCONNECTED = 'game-player-disconnected';
Game.EVENT_ROOM_CREATED = 'game-room-created';
Game.EVENT_ROOM_REMOVED = 'game-room-removed';

Game.prototype.addPlayer = function(player) {
  this.emit(Game.EVENT_PLAYER_CONNECTED, player);
  // Send list of rooms
  player.send(Message.ROOMS, this.getRoomInfo());
}

Game.prototype.removePlayer = function(player) {
  this.emit(Game.EVENT_PLAYER_DISCONNECTED, player);
}

Game.prototype.addRoom = function(room) {
  if(this.rooms[room.name])
    return null;

  // Add room
  var self = this;
  this.rooms[room.name] = room;
  this.emit(Game.EVENT_ROOM_CREATED, room);

  room.on(Room.EVENT_PART, function() {
    // Remove room if all players left
    if(!room.numPlayers() && !room.options.persistent) {
      self.emit(Game.EVENT_ROOM_REMOVED, room);
      room.removeAllListeners();
      delete self.rooms[room.name];
    }
  });

  return room;
}

Game.prototype.getRoomInfo = function() {
  return Object.keys(this.rooms).map(id => ({
    n: id,
    p: this.rooms[id].numPlayers(),
    s: room.state,
  }))
}

Game.prototype.send = function() {
  this.io.emit.apply(this.io, arguments);
}

// Export this class
module.exports = Game;
