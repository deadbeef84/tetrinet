var util = require('util'),
  Message = require('./message'),
  Room = require('./room');

// class Player extends EventEmitter
var Player = function(game, client) {
  this.game = game;
  this.client = client;
  this.identity = 'unknown';
  this.name = "client_" + client.id;
  this.room = null;
  this.index = 0;
  this.team = '';
  this.state = Player.STATE_IDLE;
  this.ready = true;

  var player = this;

  this.client.on(Message.SET_NAME, function(name) {
    player.name = name;
    player.emit(Player.EVENT_CONNECTED);
  });

  this.client.on(Message.SET_READY, function(ready) {
    player.ready = ready;
  });

  this.client.on(Message.SET_ROOM, function(name) {
    // Remove from existing room
    if(player.room)
      player.room.removePlayer(player);

    // Reset state
    player.room = null;
    player.isPlaying = false;
    player.team = '';
    player.state = Player.STATE_IDLE;

    // Add to new room
    var room = game.rooms[name];
    if(room)
      room.addPlayer(player);
  });
}
util.inherits(Player, process.EventEmitter);

// Events
Player.EVENT_CONNECTED = 'player-connected';
Player.EVENT_GAMEOVER = 'player-gameover';

// States
Player.STATE_IDLE = 0;
Player.STATE_PLAYING = 1;
Player.STATE_DEAD = 2;
Player.STATE_WINNER = 3;

/*

// handleMessage(object p)
Player.prototype.handleMessage = function(p) {
  console.log('got message: ' + p.t);
  switch(p.t) {
    case Message.PING:
      break;

    case Message.JOIN:
      this.name = p.name || "Error";
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

    case Message.UPDATE_PIECE:
      if(this.room)
        this.room.broadcast(Message.UPDATE_PIECE, {id: this.index, pt: p.pt, x: p.x, y: p.y, r: p.r}, this );
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
      if(this.room) {
        for(var i=0; i<this.room.players.length; ++i) {
          var player = this.room.players[i];
          if(!player)
            continue;
          if(player !== this && (this.team === '' || this.team !== player.team))
            player.send(Message.LINES, {n: p.n, id: this.index});
        }
      }
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

    case Message.CREATE_ROOM:
      if(this.room)
        this.room.removePlayer(this);
      this.game.addRoom(new Room(p.name, {
        width: parseInt(p.width),
        height: parseInt(p.height),
        entrydelay: parseInt(p.entrydelay),
        specials: p.specials ? true : false,
        generator: parseInt(p.generator),
        rotationsystem: parseInt(p.rotationsystem),
        tspin: p.tspin ? true : false,
        holdpiece: p.holdpiece ? true : false,
        nextpiece: parseInt(p.nextpiece)
      }));
      break;

    case Message.NAME:
      this.name = p.name;
      this.room.broadcast(Message.NAME, {id:this.index, name:this.name}, this);
      break;

    case Message.SET_TEAM:
      if(this.room && this.room.state == Room.STATE_STOPPED) {
        this.team = p.team;
        this.send(Message.SET_PLAYER, {p: this.getClientInfo(), self: true});
        this.room.broadcast(Message.SET_PLAYER, {p: this.getClientInfo()}, this);
      }
      break;

    default:
      console.log('Unknown packet type: ' + p.t);
  }
}
*/

Player.prototype.getClientInfo = function() {
  return {
    name: this.name,
    index: this.index,
    team: this.team
  };
}

Player.prototype.setRoom = function(room, index) {
  this.room = room;
  this.index = index;
  this.send(Message.SET_ROOM, {r: room ? room.getClientInfo() : null});
}

Player.prototype.send = function() {
  this.client.emit.apply(this.client, arguments);
}

// Send to everyone in room except self
Player.prototype.sendRoom = function() {
  if (this.room) {
    var s = this.client.broadcast.to(this.room.name);
    s.emit.apply(s, arguments);
  }
}

// Export this class
module.exports = Player;
