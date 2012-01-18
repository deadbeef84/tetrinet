/*
 * Catbox v0.1
 * Yes, it's another lightbox!
 *
 * Usage:
 *
 * $('#myPopupElement').catbox("Title"); // optionally add width, height etc
 * $.BW.catbox.createFromUrl('http://www.mydomain.com/ajax/form.php'); // loads HTML from URL
 * $.BW.catbox.close(); // hides the popup (and places the element at its original place in the DOM tree)
 *
 */

(function($){
	
	if (!$.BW) { $.BW = new Object(); };
	
	// the catbox event constants
	
	$.BW.CB_EVENT_OPEN = 'cb_open'; // dispatched by #cb_container after catbox is opened
	$.BW.CB_EVENT_CLOSE = 'cb_close'; // dispatched by #cb_container before catbox is closed
	$.BW.CB_EVENT_LOAD_COMPLETE = 'cb_load_complete'; // dispatched by #cb_container after remote content is loaded
	
	$.BW.CB_EVENT_INIT_COMPLETE = 'cb_init_complete'; // dispatched by document after catbox is opened
	$.BW.CB_EVENT_CLOSE_COMPLETE = 'cb_close_complete'; // dispatched by document after catbox is closed
	
	$.BW.catbox = function(el, title, width, height, callback, options) {
		
		var base = this;
		base.el = el;
		base.$el = $(el);
		base.$el.data("BW.catbox", base);
		base.previousParent = base.el.parentNode;
		base.keypressEventHandler = function(event) { if (event.keyCode == 27) { base.catbox_close(); } };
		
		base.init = function () {
			
			if( typeof( title ) === "undefined" || title === null ) title = "";
			
			base.title = title;
			base.width = width;
			base.height = height;
			base.callback = callback;
			base.options = $.extend({}, $.BW.catbox.defaultOptions, options);
			
			// attach objects to DOM
			$.BW.catbox.title.text(base.title);
			
			if (base.options.closeButton)
				$.BW.catbox.title.append($.BW.catbox.closebutton);
			
			$.BW.catbox.base = base;
			$.BW.catbox.container.append($.BW.catbox.title)
			                     .append($.BW.catbox.base.el);
			
			$("body").append($.BW.catbox.overlay)
			         .append($.BW.catbox.container);
			
			// css
			$.BW.catbox.overlay.css({
				"background-color": base.options.overlayColor,
				"opacity": base.options.opacity,
				"filter": "alpha(opacity="+Math.round(base.options.opacity * 100)+")",
				"position": "absolute",
				"display": "none",
				"z-index": 1000
			});
			$.BW.catbox.container.css({
				"position": "fixed",
				"display": "none",
				"padding": "1px",
				"z-index": 1001,
				"box-shadow": "4px 4px 8px rgba(0, 0, 0, 0.25)",
				"-moz-box-shadow": "4px 4px 8px rgba(0, 0, 0, 0.25)",
				"-webkit-box-shadow": "4px 4px 8px rgba(0, 0, 0, 0.25)"
			});
			if( typeof( base.width ) !== "undefined" && base.width !== null )
				$.BW.catbox.container.css("width", base.width);
			else
				$.BW.catbox.container.css("width", 'auto');
				
			if( typeof( base.height ) !== "undefined" && base.height !== null )
				$.BW.catbox.container.css("height", base.height);
			else
				$.BW.catbox.container.css("height", 'auto');
			
			// hooks for clicking background, window resizing, pressing esc
			$(window).resize(base.catbox_resize);
			$(window).scroll(base.catbox_resize);
			$(window).keypress(base.keypressEventHandler);
			
			if (base.options.closeWithOverlayClick)
				$.BW.catbox.overlay.click(base.catbox_close);
			
			// run the users hooks, resize and fade in
			if (typeof(base.callback) === 'function')
				base.callback.call(base.el);
			
			base.catbox_resize();
			
			$.BW.catbox.container.fadeIn(base.options.fadeInTime);
			$.BW.catbox.overlay.fadeTo(base.options.fadeInTime, base.options.overlayOpacity);
			
			// dispatch events
			$.BW.catbox.container.trigger($.BW.CB_EVENT_OPEN);
			$(document).trigger($.BW.CB_EVENT_INIT_COMPLETE);
		};
		
		base.catbox_close = function (callback) {
			
			$.BW.catbox.container.trigger($.BW.CB_EVENT_CLOSE);
			
			$.BW.catbox.overlay.unbind('click', base.catbox_close);
			$(window).unbind('resize', base.catbox_resize);
			$(window).unbind('scroll', base.catbox_resize);
			$(window).unbind('keypress', base.keypressEventHandler);
			
			$.BW.catbox.overlay.fadeOut(base.options.fadeOutTime);
			$.BW.catbox.container.fadeOut(base.options.fadeOutTime, function () {
				
				base.$el.detach();
				$(base.previousParent).append(base.el);
				
				$.BW.catbox.overlay.detach();
				$.BW.catbox.container.detach();
				$.BW.catbox.title.detach();
				$.BW.catbox.closebutton.detach();
				
				if (typeof(callback) === 'function')
					callback.call(base.el);
				
				$.BW.catbox.base = null;
				$(document).trigger($.BW.CB_EVENT_CLOSE_COMPLETE);
			});
		};
		
		base.catbox_resize = function (event) {
			
			var $window = $(window);
			var winScrollTop = $window.scrollTop();
			var winScrollLeft = $window.scrollLeft();
			var winHeight = $window.height();
			var winWidth = $window.width();
			
			$.BW.catbox.overlay.css({
				top: winScrollTop,
				left: winScrollLeft,
				width: winWidth,
				height: winHeight
			});
			$.BW.catbox.container.css({
				top: Math.max(base.options.minimumPadding, ((winHeight - $.BW.catbox.container.height()) * 0.5)),
				left: Math.max(base.options.minimumPadding, ((winWidth - $.BW.catbox.container.width()) * 0.5))
			});
		};
		
		base.init();
	};
	
	// all dom objects used in the catbox
	$.BW.catbox.base = null;
	$.BW.catbox.overlay = $('<div id="cb_overlay"></div>');
	$.BW.catbox.container = $('<div id="cb_container" class="block"></div>');
	$.BW.catbox.title = $('<h3 id="cb_titlebar"></h3>');
	$.BW.catbox.closebutton = $('<button class="cb_closebutton">X</button>');
	$.BW.catbox.loadbox = $('<div id="cb_loadbox"><div class="section"><img class="cb_loadanimation" src="images/ajax-loader.gif" alt="" /></div></div>');
	
	// utility functions for retrieving data in the popup
	// usage: $.BW.catbox.getFormData(["#my-text-input", ...]);
	$.BW.catbox.getFormData = function(elements) {
		var data = {};
		for (var selector in elements) {
			data[selector] = $(selector, $.BW.catbox.base.el).val();
		}
		return data;
	};
	
	// utility functions for setting form data in the popup
	// usage: $.BW.catbox.putFormData({ "#my-text-input" : "value", "#another-text-input" : 123, ...});
	$.BW.catbox.putFormData = function(data) {
		for (var selector in data) {
			$(selector, $.BW.catbox.base.el).val(data[selector]);
		}
	};
	
	$.BW.catbox.defaultOptions = {
		showOverlay: true,
		overlayColor: "#000",
		overlayOpacity: 0.5,
		fadeInTime: 500,
		fadeOutTime: 500,
		minimumPadding: 20,
		closeButton: true,
		closeWithOverlayClick: true
	};
	
	$.fn.catbox = function(title, width, height, callback, options) {
		if ($.BW.catbox.base !== null) {
			// if the catbox is open we wait for it to close first
			var obj = this;
			$(document).one($.BW.CB_EVENT_CLOSE_COMPLETE, function() {
				new $.BW.catbox(obj, title, width, height, callback, options);
			});
			$.BW.catbox.base.catbox_close();
			// not really sure what the correct return value is here
			return this;
		}
		return this.each(function() {
			(new $.BW.catbox(this, title, width, height, callback, options));
		});
	};
	
	$.BW.catbox.createFromUrl = function(url, data, complete, args) {
		
		if( typeof( args ) === "undefined" || args === null ) args = {};
		
		// in case the catbox is already open, we wait until we get the CB_EVENT_OPEN event
		// (we may need to wait for the current popup to fade out)
		
		$(document).one($.BW.CB_EVENT_INIT_COMPLETE, function() {
			
			$.BW.catbox.base.$el.load(url, data, function() {
			
				$('.cb_loadanimation', $.BW.catbox.base.el).remove();
				
				// set the correct title
				var children = $.BW.catbox.title.children(); // text() kills all children (the close button)
				$.BW.catbox.title.text(args.title).append(children);
				
				// set the correct dimensions, if there are any set
				if( typeof( args.width ) !== "undefined" && args.width !== null ) {
					$.BW.catbox.base.width = args.width;
					$.BW.catbox.container.css("width", args.width);
				}
				if( typeof( args.height ) !== "undefined" && args.height !== null ) {
					$.BW.catbox.base.height = args.height;
					$.BW.catbox.container.css("height", args.height);
				}
				$.BW.catbox.base.catbox_resize();
				
				// execute the users callback
				if (typeof(complete) === "function")
					complete.call($.BW.catbox.base);
				
				$.BW.catbox.container.trigger($.BW.CB_EVENT_LOAD_COMPLETE);
				
				Shadowbox.setup();
			});
		});
		
		// display the loading animation until the real data is loaded
		
		$.BW.catbox.loadbox.clone().catbox("Loading...", null, null, args.callback, args.options);
	};
	
	$.BW.catbox.close = function(callback) {
		if ($.BW.catbox.base !== null)
			$.BW.catbox.base.catbox_close(callback);
	};
	
	$.BW.catbox.resize = function() {
		if ($.BW.catbox.base !== null)
			$.BW.catbox.base.catbox_resize();
	};
	
	// all elements with the class cb_closebutton will close the catbox
	
	$.BW.catbox.container.delegate(".cb_closebutton", "click", $.BW.catbox.close);
	
})(jQuery);
