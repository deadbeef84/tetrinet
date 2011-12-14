function isArray(ar) {
  return ar instanceof Array
      || Array.isArray(ar)
      || (ar && ar !== Object.prototype && isArray(ar.__proto__));
}

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
	console.log('window is active');
	Bw.windowIsActive = true;
});

$(window).blur(function() {
	console.log('window is inactive');
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
