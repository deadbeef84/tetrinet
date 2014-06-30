var Message = {};

var messages = 
[    'PING'
    ,'JOIN'
    ,'SET_PLAYER'
    ,'REMOVE_PLAYER'
    ,'READY'
    ,'START'
    ,'UPDATE_BOARD'
    ,'GAMEOVER'
    ,'LINES'
    ,'CHAT'
    ,'SPECIAL'
    ,'WINNER'
    ,'ROOMS'
    ,'CREATE_ROOM'
    ,'SET_ROOM'
    ,'NAME'
    ,'SET_TEAM'
    ,'UPDATE_PIECE'
];

for(var i=0; i<messages.length; ++i) {
    var s = messages[i];
    Message[s.toUpperCase()] = s.toLowerCase(); // for debugging
//    Message[s.toUpperCase()] = i; // live;
}

if(typeof(module) !== 'undefined')
    module.exports = Message;