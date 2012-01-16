<?php

$CONFIG = array(
	'host' => 'tetrinet.se',
	'base_path' => 'tetrinet/www',
	'base_href' => 'http://tetrinet.se/',
	'singleplayer_enabled' => isset($_GET['single_player']),
	'autoplay_enabled' => false,//isset($_GET['autoplay']),
	'openid_enabled' => true
);