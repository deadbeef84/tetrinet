exports.Player = require('./player');
exports.Room = require('./room');
exports.Game = require('./game');
exports.createGame = function(port) {
	return new exports.Game(port);
};
