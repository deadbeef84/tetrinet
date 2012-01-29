<?php

$CONFIG = array(
	'host' => $_SERVER['HTTP_HOST'], // change when using openid
	'port' => 7000,
	'singleplayer_enabled' => isset($_GET['single_player']),
	'autoplay_enabled' => false,//isset($_GET['autoplay']),
	'openid_enabled' => true
);