<?php
require 'config.php';

// force host
if ($_SERVER['HTTP_HOST'] != $CONFIG['host']) {
	header("Location: http://{$CONFIG['host']}/", true, 301);
}

// OpenID
$loggedIn = false;
if ($CONFIG['openid_enabled'] && !$CONFIG['singleplayer_enabled']) {
	require 'openid.php';
	
	$openid = new LightOpenID($CONFIG['host']);
	$openid->required = array('contact/email');
	if(!$openid->mode) {
		if(isset($_GET['logout'])) {
			setcookie('openid', '');
		} elseif(isset($_COOKIE['openid'])) {
			// login using cookie
			$openid->identity = $_COOKIE['openid'];
			header('Location: ' . $openid->authUrl(true));
			exit;
		} elseif(isset($_GET['openid_identifier'])) {
			// step 1: redirect to provider
			$openid->identity = $_GET['openid_identifier'];
			header('Location: ' . $openid->authUrl());
			exit;
		}
	} elseif($openid->mode == 'cancel') {
		die('User has canceled authentication!');
	} elseif($openid->validate()) {
		// step 2: logged in, remember claimed identity
		setcookie('openid', $openid->identity, time() + 365*24*3600);
		$a = $openid->getAttributes();
		$loggedIn = $a['contact/email'];
	} else {
		die('error');
	}
}

// add modification time to filename
function filewithmtime($file) {
	return $file.'?'.filemtime($file);
}

?>
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="keywords" content="" />
  <meta name="description" content="" />
  <title>Tetrinet</title>
  
  <link href="http://fonts.googleapis.com/css?family=Bevan:regular" media="all" type="text/css" rel="stylesheet" />
  <link href="http://fonts.googleapis.com/css?family=Ubuntu:regular,bold&amp;subset=Latin" media="all" type="text/css" rel="stylesheet" />
  <link href="bootstrap/css/bootstrap.min.css" media="all" type="text/css" rel="stylesheet" />
  <link href="css/style.css" media="all" type="text/css" rel="stylesheet" />
  <link type="text/css" rel="stylesheet" href="openid-selector/css/openid.css" />
  
  <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js" type="text/javascript"></script>
  <script src="http://<?php echo $CONFIG['host'].':'.$CONFIG['port']?>/socket.io/socket.io.js" type="text/javascript"></script>
  <script src="js/jquery.cookies.2.2.0.min.js" type="text/javascript"></script>
  <script src="<?php echo filewithmtime('js/jquery.bw.catbox.js')?>" type="text/javascript"></script>
  <script src="<?php echo filewithmtime('js/base.js')?>" type="text/javascript"></script>
  <script src="<?php echo filewithmtime('js/eventemitter.js')?>" type="text/javascript"></script>
  <script src="<?php echo filewithmtime('js/timer.js')?>" type="text/javascript"></script>
  <script src="<?php echo filewithmtime('js/prng.js')?>" type="text/javascript"></script>
  <script src="<?php echo filewithmtime('js/message.js')?>" type="text/javascript"></script>
  <script src="<?php echo filewithmtime('js/specials.js')?>" type="text/javascript"></script>
  <script src="<?php echo filewithmtime('js/block.js')?>" type="text/javascript"></script>
  <script src="<?php echo filewithmtime('js/board.js')?>" type="text/javascript"></script>
  <script src="<?php echo filewithmtime('js/player.js')?>" type="text/javascript"></script>
  <script src="<?php echo filewithmtime('js/playerview.js')?>" type="text/javascript"></script>
  <script src="<?php echo filewithmtime('js/game.js')?>" type="text/javascript"></script>
  <script src="<?php echo filewithmtime('js/gameview.js')?>" type="text/javascript"></script>
  <script src="<?php echo filewithmtime('js/settings.js')?>" type="text/javascript"></script>
  <script src="<?php echo filewithmtime('js/bot.js')?>" type="text/javascript"></script>
  <script type="text/javascript" src="openid-selector/js/openid-jquery.js"></script>
  <script type="text/javascript" src="openid-selector/js/openid-en.js"></script>

<script type="text/javascript">
$(document).ready(function() {
	// Update name field
	$('#name').val($.cookies.get('settings_name') || ('Guest' + Math.floor(1000 * Math.random())));
	
	// Start game
	function start(name) {
		var g = new Game(name, <?php echo $CONFIG['port']?>);
		Object.seal(g);
		<?php if ($CONFIG['autoplay_enabled']) { ?>
		var b = new Bot(g);
		<?php } ?>
		$('#login').hide();
		$(name ? '#lobby' : '#ingame').show();
	}
	
<?php if (!$CONFIG['singleplayer_enabled']) { ?>
	// Login
	$('#login-form').submit(function() {
		var name = $(this).find('#name').val(),
			date = new Date();
		$.cookies.set('settings_name', name, { expiresAt: new Date(date.getFullYear()+1, date.getMonth(), date.getDay()) });
		Settings.name = name;
		start(name);
		return false;
	});
<?php } else { ?>
	// Singleplayer
	start('');
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
        <p><label for="settings_ghostblock">Ghost block</label><input id="settings_ghostblock" type="checkbox" name="ghostblock" /></p>
        <p><label for="settings_attacknotifications">Attack notifications</label><input id="settings_attacknotifications" type="checkbox" name="attacknotifications" /></p>
        <p><label for="settings_keyrepeatdelay">Key repeat delay</label><input id="settings_keyrepeatdelay" type="text" name="keyrepeatdelay" /></p>
        <p><label for="settings_keyrepeatinterval">Key repeat interval</label><input id="settings_keyrepeatinterval" type="text" name="keyrepeatinterval" /></p>
        <p><label for="settings_buffersize">Log buffer size</label><input id="settings_buffersize" type="text" name="buffersize" /></p>
        <p><label for="settings_logautoscroll">Log auto scroll</label><input id="settings_logautoscroll" type="checkbox" name="autoscroll" /></p>
        <h3>Keys</h3>
        <div id="settings_keys">
	      <p><label for="settings_km_left">Left</label><input id="settings_km_left" class="keycode_listener" type="text" name="left" /></p>
	      <p><label for="settings_km_right">Right</label><input id="settings_km_right" class="keycode_listener" type="text" name="right" /></p>
	      <p><label for="settings_km_down">Soft drop</label><input id="settings_km_down" class="keycode_listener" type="text" name="down" /></p>
	      <p><label for="settings_km_drop">Hard drop</label><input id="settings_km_drop" class="keycode_listener" type="text" name="drop" /></p>
        <p><label for="settings_km_softdrop">Sonic drop</label><input id="settings_km_softdrop" class="keycode_listener" type="text" name="soft_drop" /></p>
        <p><label for="settings_km_hold">Hold piece</label><input id="settings_km_hold" class="keycode_listener" type="text" name="hold" /></p>
        <p><label for="settings_km_talk">Talk</label><input id="settings_km_talk" class="keycode_listener" type="text" name="talk" /></p>
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
    <div id="createroom_popup">
      <form>
        <p>
          <label for="createroom_name">Name</label>
          <input id="createroom_name" type="text" name="name" />
        </p>
        <p>
          <label for="createroom_width">Width</label>
          <input id="createroom_width" type="text" name="width" value="12" />
        </p>
        <p>
          <label for="createroom_height">Height</label>
          <input id="createroom_height" type="text" name="height" value="24" />
        </p>
        <p>
          <label for="createroom_entrydelay">Entry delay</label>
          <input id="createroom_entrydelay" type="text" name="entrydelay" value="500" />
        </p>
        <p>
          <label for="createroom_specials">Specials</label>
          <input id="createroom_specials" type="checkbox" name="specials" />
        </p>
        <p>
          <label for="createroom_tspin">T-spin</label>
          <input id="createroom_tspin" type="checkbox" name="tspin" />
        </p>
        <p>
          <label for="createroom_holdpiece">Hold piece</label>
          <input id="createroom_holdpiece" type="checkbox" name="holdpiece" />
        </p>
        <p>
          <label for="createroom_nextpiece">Next pieces</label>
          <select id="createroom_nextpiece" name="nextpiece">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </p>
        <p>
          <label for="createroom_generator">Generator</label>
          <select id="createroom_generator" name="generator">
            <option value="1">7 Bag</option>
            <option value="0">Random</option>
          </select>
        </p>
        <p>
          <label for="createroom_rotationsystem">Rotation system</label>
          <select id="createroom_rotationsystem" name="rotationsystem">
            <option value="1">SRS</option>
            <option value="0">Classic</option>
          </select>
        </p>
        <p>
          <input type="button" class="cancel" value="Cancel" />
          <input type="submit" value="Create" />
        </p>
      </form>
    </div>
  </div>
  
  <div id="container">
  
    <a href="" id="settings_show" class="settings_toggle" title="Settings"><img src="images/settings.png" width="20" height="20" alt="Settings" /></a>
  
    <div id="login">
      <header>
        <h1>Tetrinet</h1>
      </header>
      <?php if($CONFIG['openid_enabled'] && !$CONFIG['singleplayer_enabled'] && $loggedIn === false) {?>
      <script>
      $(document).ready(function() {
      	openid.init('openid_identifier');
      });
      </script>
      <form action="#" method="get" id="openid_form">
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
      <form action="#" method="get" id="login-form">
		<div class="input-append">
		  <input type="text" id="name" name="name" placeholder="Name" value="" />
          <button class="btn">Enter</button>
		</div>
      </form>
        <?php if($loggedIn) {?>
      <p><a href="?logout=1">Logout (<?php echo $loggedIn ?>)</a></p>
        <?php } ?>
      <?php } ?>
    </div>

    <div id="lobby" style="display:none">
      <h2>Rooms</h2>
      <ul>
        <li>Loading...</li>
      </ul>
	  <p><a href="" id="createroom_show" class="btn">+</a></p>
    </div>

    <div id="ingame" class="form-inline" style="display:none">
	  <div id="topbar">
      <a href="" id="leave_room" class="btn">←</a>
      <select id="team">
        <option value="">[Team: None]</option>
        <option value="salmon">Red</option>
        <option value="lightblue">Blue</option>
        <option value="lightgreen">Green</option>
        <option value="khaki">Yellow</option>
        <option value="hotpink">Pink</option>
      </select>
      <button id="startbtn" class="btn">Start Game</button>
      </div>
      <div id="gamearea">
      </div>
      <div id="chatbox">
        <div id="chat"></div>
        <form>
          <input type="text" id="message" placeholder="Enter message..." class="input-block-level"/>
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
