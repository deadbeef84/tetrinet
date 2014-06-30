function getCharFromKeyCode(keyCode) {
	
	var keyCodeMap = {
	    8:"backspace", 9:"tab", 13:"return", 16:"shift", 17:"ctrl", 18:"alt", 19:"pausebreak", //???
	    20:"capslock", 27:"esc", 32:"space", 33:"pgup", 34:"pgdn", 35:"end", 36:"home", 37:"left",
	    38:"up", 39:"right", 40:"down", 43:"+", 44:"printscreen", 45:"ins", 46:"del",
	    48:"0", 49:"1", 50:"2", 51:"3", 52:"4", 53:"5", 54:"6", 55:"7", 56:"8", 57:"9", 59:";",
	    61:"=", 65:"a", 66:"b", 67:"c", 68:"d", 69:"e", 70:"f", 71:"g", 72:"h", 73:"i", 74:"j", 75:"k", 76:"l",
	    77:"m", 78:"n", 79:"o", 80:"p", 81:"q", 82:"r", 83:"s", 84:"t", 85:"u", 86:"v", 87:"w", 88:"x", 89:"y", 90:"z",
	    91:"cmd", 93:"cmd",
	    96:"0", 97:"1", 98:"2", 99:"3", 100:"4", 101:"5", 102:"6", 103:"7", 104:"8", 105:"9",
	    106: "*", 107:"+", 109:"-", 110:".", 111: "/",
	    112:"f1", 113:"f2", 114:"f3", 115:"f4", 116:"f5", 117:"f6",
	    118:"f7", 119:"f8", 120:"f9", 121:"f10", 122:"f11", 123:"f12",
	    144:"numlock", 145:"scrolllock",
	    186:";", 187:"=", 188:",", 189:"-", 190:".", 191:"/", 192:"`", 219:"[", 220:"\\", 221:"]", 222:"'"
	};
	
	return keyCodeMap[keyCode] ? keyCodeMap[keyCode].toUpperCase() : "[" + keyCode + "]";
}

function isArray(ar) {
  return ar instanceof Array
      || Array.isArray(ar)
      || (ar && ar !== Object.prototype && isArray(ar.__proto__));
}

function inArray(arr, obj) { return arr.indexOf(obj) != -1; };

Bw = {};

Bw.extend = function(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
        	value: ctor,
        	enumerable: false
        }
    });
};

Bw.setCookie = function(name, data) {
	var date = new Date();
	var options = { expiresAt: new Date(date.getFullYear()+1, date.getMonth(), date.getDay()) };
	$.cookies.set(name, data, options);
}

function htmlspecialchars(str) {
	return str.replace(/&/g, "&amp;")
		.replace(/"/g, "&quot;")
  		.replace(/'/g, "&#039;")
  		.replace(/</g, "&lt;")
  		.replace(/>/g, "&gt;");
}

if(!window.console) {
	window.console = {};
	window.console.log = function() {};
}

Bw.windowIsActive = false;
$(window).focus(function() {
	Bw.windowIsActive = true;
});

$(window).blur(function() {
	Bw.windowIsActive = false;
});

if(typeof Object.create == 'undefined') {
    Object.create = function (o, p) {
        function F() {}
        F.prototype = o;
        return new F();
    };
}

if(typeof Object.freeze == 'undefined') {
	console.log('Object.freeze missing!');
	Object.freeze = function( obj ) {
		/*
		var props = Object.getOwnPropertyNames( obj );
		for ( var i = 0; i < props.length; i++ ) {
			var desc = Object.getOwnPropertyDescriptor( obj, props[i] );
			if ( "value" in desc )
				desc.writable = false;
			desc.configurable = false;
			Object.defineProperty( obj, props[i], desc );
		}
		//return Object.preventExtensions( obj );
		*/
		return obj;
	};
}

if(typeof Object.seal == 'undefined') {
	Object.seal = function( obj ) {
		/*
		var props = Object.getOwnPropertyNames( obj );
		for ( var i = 0; i < props.length; i++ ) {
			var desc = Object.getOwnPropertyDescriptor( obj, props[i] );
			desc.configurable = false;
			Object.defineProperty( obj, props[i], desc );
		}
		//return Object.preventExtensions( obj );
		*/
	}
}
Object.freeze(Object);

Bw.recursiveFreeze = function(obj) {
	for (var p in obj) {
		if(typeof(obj[p]) == 'object')
			Bw.recursiveFreeze(obj[p]);
	}
	return Object.freeze(obj);
}
