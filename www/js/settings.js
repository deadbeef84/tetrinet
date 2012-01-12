// Set default settings and check for cookie.

Settings = {
	'name': '',
	'tabs': { buffer_size: 100, filters: [ [], [Game.LOG_YOU] ] },
	'keymap': {
		'left': 37,
		'right': 39,
		'down': 40,
		'drop': 32,
		'soft_drop': 17,
		'rotate_cw': 38,
		'rotate_ccw': 90,
		'inventory_1': 49,
		'inventory_2': 50,
		'inventory_3': 51,
		'inventory_4': 52,
		'inventory_5': 53,
		'inventory_6': 54,
		'inventory_7': 55,
		'inventory_8': 56,
		'inventory_9': 57,
		'inventory_self': 83,
		'inventory_target_left': 87,
		'inventory_target_right': 69,
		'inventory_target_send': 81
	}
};

if ($ && $.cookies) {

	var SavedSettings = {
		'name': $.cookies.get('name'),
		'tabs': $.cookies.get('tabs'),
		'keymap': $.cookies.get('keymap')
	};
	
	for (key in Settings) {
		if (SavedSettings[key] != null) {
			Settings[key] = SavedSettings[key];
		}
	}
}