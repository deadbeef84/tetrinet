// Set default settings and check for cookie.

Settings = {
	name: '',
	misc: {
		ghost_block: true,
		attack_notifications: true
	},
	log: {
		buffer_size: 100,
		selected_filter: 0,
		filters: [ { title: 'All', classes: ['log-status', 'log-lines', 'log-special'], closeButton: false } ]
	},
	keymap: {
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
		'inventory_target_left': 81,
		'inventory_target_right': 69,
		'inventory_target_send': 87
	}
};

if ($ && $.cookies) {

	var SavedSettings = {
		'name': $.cookies.get('settings_name'),
		'misc': $.cookies.get('settings_misc'),
		'log': $.cookies.get('settings_log'),
		'keymap': $.cookies.get('settings_keymap')
	};
	
	for (key in Settings) {
		if (SavedSettings[key] != null) {
			Settings[key] = SavedSettings[key];
		}
	}
}