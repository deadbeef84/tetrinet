<?php

$CONFIG = array(
	'host' => 'localhost', //'tetrinet.se'
	'base_path' => 'tetrinet/www',
	'base_href' => 'http://localhost/tetrinet/www/', //'http://tetrinet.se/'
	'singleplayer_enabled' => isset($_GET['single_player']),
	'autoplay_enabled' => isset($_GET['autoplay']),
	'openid_enabled' => false
);