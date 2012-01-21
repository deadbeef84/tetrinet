<?php
require 'config.php';
//session_start();
if ($_SERVER['HTTP_HOST'] != $CONFIG['host']) {
	header("Location: http://{$CONFIG['host']}/", true, 301);
}

$name = isset($_COOKIE['settings_name']) ? $_COOKIE['settings_name'] : 'Guest'.rand();

if ($CONFIG['openid_enabled'] && !$CONFIG['singleplayer_enabled']) {
	require 'openid.php';
	$status = '';
	try {
		//if(!isset($_SESSION['openid'])) {
			# Change 'localhost' to your domain name.
			$openid = new LightOpenID($CONFIG['host']);
			if(!$openid->mode) {
				if(isset($_GET['openid_identifier'])) {
					$openid->identity = $_GET['openid_identifier'];
					# The following two lines request email, full name, and a nickname
					# from the provider. Remove them if you don't need that data.
					$openid->required = array('contact/email');
					//$openid->optional = array('namePerson', 'namePerson/friendly');
					
					header('Location: ' . $openid->authUrl());
				}
			} elseif($openid->mode == 'cancel') {
				$status = 'User has canceled authentication!';
			} else {
				if($openid->validate()) {
					$status = 'User has logged in.';
					$_SESSION['openid'] = array(
						'identity' => $openid->identity,
						'attributes' => $openid->getAttributes(),
					);
					$a = $openid->getAttributes();
					$e = $a['contact/email'];
					if (!isset($_COOKIE['settings_name']))
						$name = substr($e, 0, strpos($e, '@'));
				} else {
					$status = 'not valid';
				}
			}
		//}
	}
	catch(Exception $e) {
		echo $e->getMessage();
	}
}
$version = time('u');
?>
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="keywords" content="" />
  <meta name="description" content="" />
  <title>Tetrinet</title>
  <base href="<?="http://{$CONFIG['host']}/{$CONFIG['base_path']}/"?>"></base>

  <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js" type="text/javascript"></script>
  <script src="http://<?=$CONFIG['host']?>:7000/socket.io/socket.io.js" type="text/javascript"></script>
  <script src="js/jquery.cookies.2.2.0.min.js" type="text/javascript"></script>
  <script src="js/jquery.bw.catbox.js" type="text/javascript"></script>
  <script src="js/base.js?<?=$version?>" type="text/javascript"></script>
  <script src="js/eventemitter.js?<?=$version?>" type="text/javascript"></script>
  <script src="js/timer.js?<?=$version?>" type="text/javascript"></script>
  <script src="js/prng.js?<?=$version?>" type="text/javascript"></script>
  <script src="js/block.js?<?=$version?>" type="text/javascript"></script>
  <script src="js/board.js?<?=$version?>" type="text/javascript"></script>
  <script src="js/player.js?<?=$version?>" type="text/javascript"></script>
  <script src="js/message.js?<?=$version?>" type="text/javascript"></script>
  <script src="js/game.js?<?=$version?>" type="text/javascript"></script>
  <script src="js/settings.js?<?=$version?>" type="text/javascript"></script>
  <script src="js/bot.js?<?=$version?>" type="text/javascript"></script>
  <script type="text/javascript" src="openid-selector/js/openid-jquery.js"></script>
  <script type="text/javascript" src="openid-selector/js/openid-en.js"></script>
  <link type="text/css" rel="stylesheet" href="openid-selector/css/openid.css" />
  <link href="http://fonts.googleapis.com/css?family=Bevan:regular" media="all" type="text/css" rel="stylesheet" />
  <link href="http://fonts.googleapis.com/css?family=Ubuntu:regular,bold&amp;subset=Latin" media="all" type="text/css" rel="stylesheet" />
  <link href="css/style.css" media="all" type="text/css" rel="stylesheet" />
<script type="text/javascript">
$(document).ready(function() {
<?php if(!$CONFIG['singleplayer_enabled']) {?>
  <?php if($CONFIG['openid_enabled'] && !isset($_SESSION['openid'])) {?>
	openid.init('openid_identifier');
  <?php } else { ?>
	$('#login-form').submit(function() {
		var name = $(this).find('#name').val();
		var date = new Date();
		$.cookies.set('settings_name', name, { expiresAt: new Date(date.getFullYear()+1, date.getMonth(), date.getDay()) });
		Settings.name = name;
		var g = new Game(name);
		Object.seal(g);
  <?php if ($CONFIG['autoplay_enabled']) { ?>
		var b = new Bot(g);
  <?php } ?>
		$('#login').hide();
		$('#lobby').show();
		return false;
	});
  <?php } ?>
<?php } else { ?>
	// autostart single player
	$('#login').hide();
	$('#ingame').show();
	var g = new Game();
	Object.seal(g);
  <?php if ($CONFIG['autoplay_enabled']) { ?>
	var b = new Bot(g);
  <?php } ?>
<?php } ?>
});
</script>
</head>

<body id="page">
  
  <div id="popup">
    <div id="settings_popup">
      <form id="settings">
        <h3>Misc</h3>
        <p><label for="settings_name">Name</label><input id="settings_name" type="text" name="name" /></p>
        <p><label for="settings_buffersize">Log buffer size</label><input id="settings_buffersize" type="text" name="buffersize" /></p>
        <p><label for="settings_ghostblock">Ghost block</label><input id="settings_ghostblock" type="checkbox" name="ghostblock" /></p>
        <p><label for="settings_attacknotifications">Attack notifications</label><input id="settings_attacknotifications" type="checkbox" name="attacknotifications" /></p>
        <h3>Keys</h3>
        <div id="settings_keys">
	      <p><label for="settings_km_left">Left</label><input id="settings_km_left" class="keycode_listener" type="text" name="left" /></p>
	      <p><label for="settings_km_right">Right</label><input id="settings_km_right" class="keycode_listener" type="text" name="right" /></p>
	      <p><label for="settings_km_down">Down</label><input id="settings_km_down" class="keycode_listener" type="text" name="down" /></p>
	      <p><label for="settings_km_drop">Drop</label><input id="settings_km_drop" class="keycode_listener" type="text" name="drop" /></p>
	      <p><label for="settings_km_softdrop">Soft drop</label><input id="settings_km_softdrop" class="keycode_listener" type="text" name="soft_drop" /></p>
	      <p><label for="settings_km_rotatecw">Rotate CW</label><input id="settings_km_rotatecw" class="keycode_listener" type="text" name="rotate_cw" /></p>
	      <p><label for="settings_km_rotateccw">Rotate CCW</label><input id="settings_km_rotateccw" class="keycode_listener" type="text" name="rotate_ccw" /></p>
	      <p><label for="settings_km_self">Self</label><input id="settings_km_self" class="keycode_listener" type="text" name="inventory_self" /></p>
	      <p><label for="settings_km_targetleft">Target left</label><input id="settings_km_targetleft" class="keycode_listener" type="text" name="inventory_target_left" /></p>
	      <p><label for="settings_km_targetright">Target right</label><input id="settings_km_targetright" class="keycode_listener" type="text" name="inventory_target_right" /></p>
	      <p><label for="settings_km_targetshoot">Target shoot</label><input id="settings_km_targetshoot" class="keycode_listener" type="text" name="inventory_target_send" /></p>
	    </div>
        <p><input type="button" class="settings_toggle" id="settings_cancel" value="Cancel" /><input type="submit" id="settings_submit" value="Save" /></p>
      </form>
    </div>
    <div id="filtersettings_popup">
      <form id="filtersettings">
        <p>
          <label for="filtersettings_name">Name</label>
          <input id="filtersettings_name" type="text" name="name" />
        </p>
        <p>
          <label for="filtersettings_filters">Filters</label>
          <select id="filtersettings_filters" name="buffersize" multiple="multiple">
          </select>
        </p>
        <p>
          <input type="button" id="filtersettings_cancel" value="Cancel" />
          <input type="submit" id="filtersettings_submit" value="Save" />
        </p>
      </form>
    </div>
  </div>
  
  <div id="container">
  
    <a href="" id="settings_show" class="settings_toggle" title="Settings">Settings</a>
  
    <header>
      <h1>Tetrinet</h1>
    </header>

    <div id="login">
      <?php if($CONFIG['openid_enabled'] && !$CONFIG['singleplayer_enabled'] && !isset($_SESSION['openid'])) {?>
      <form action="/" method="get" id="openid_form">
        <?php echo $status ?>
        <input type="hidden" name="action" value="verify" />
        <fieldset>
          <legend>Sign-in or Create New Account</legend>
          <div id="openid_choice">
            <p>Please click your account provider:</p>
            <div id="openid_btns"></div>
          </div>
          <div id="openid_input_area">
            <input id="openid_identifier" name="openid_identifier" type="text" value="http://" />
            <input id="openid_submit" type="submit" value="Sign-In"/>
          </div>
          <noscript>
            <p>OpenID is service that allows you to log-on to many different websites using a single indentity.
              Find out <a href="http://openid.net/what/">more about OpenID</a> and <a href="http://openid.net/get/">how to get an OpenID enabled account</a>.</p>
          </noscript>
        </fieldset>
      </form>
      <?php } else { ?>
      <form action="<?php echo $CONFIG['base_href'] ?>" method="get" id="login-form">
        <?php if (isset($_GET['autoplay'])) echo '<input type="hidden" name="autoplay" value="1" />'; ?>
        <input type="text" id="name" name="name" value="<?php echo (isset($name)?$name:''); ?>" />
        <button>Enter</button>
      </form>
      <?php } ?>
    </div>

    <div id="lobby" style="display:none">
      <h2>Rooms</h2>
      <ul>
        <li>Loading...</li>
      </ul>
    </div>

    <div id="ingame" style="display:none">
      <div id="startbtn">
        <button>Start Game</button>
      </div>
      <div id="gamearea">
      </div>
      <div id="chatbox">
        <div id="chat"></div>
        <form>
          <label for="message">Say: </label><input type="text" id="message"/>
        </form>
      </div>
      <div id="gamelogbox">
        <ul id="gamelogfilters"><li id="gamelogfilters_add">+</li></ul>
        <div id="gamelog"></div>
      </div>
    </div>
    
  </div>
</body>
</html>