<?php
require 'config.php';
//session_start();
if ($_SERVER['HTTP_HOST'] != $CONFIG['host']) {
	header("Location: http://{$CONFIG['host']}/", true, 301);
}
if (!$CONFIG['singleplayer_enabled']) {
	require 'openid.php';
	$name = 'Guest'.rand();
	$status = '';
	try {
		//if(!isset($_SESSION['openid'])) {
			# Change 'localhost' to your domain name.
			$openid = new LightOpenID('tetrinet.se');
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
$version = 2;
?>
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="keywords" content="" />
  <meta name="description" content="" />
  <title>Tetrinet</title>
  <base href="<?=$CONFIG['base_href']?>"></base>

  <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js" type="text/javascript"></script>
  <script src="http://tetrinet.se:7000/socket.io/socket.io.js" type="text/javascript"></script>
  <script src="js/base.js?<?=$version?>" type="text/javascript"></script>
  <script src="js/eventemitter.js?<?=$version?>" type="text/javascript"></script>
  <script src="js/timer.js?<?=$version?>" type="text/javascript"></script>
  <script src="js/prng.js?<?=$version?>" type="text/javascript"></script>
  <script src="js/block.js?<?=$version?>" type="text/javascript"></script>
  <script src="js/board.js?<?=$version?>" type="text/javascript"></script>
  <script src="js/player.js?<?=$version?>" type="text/javascript"></script>
  <script src="js/message.js?<?=$version?>" type="text/javascript"></script>
  <script src="js/game.js?<?=$version?>" type="text/javascript"></script>
  <script type="text/javascript" src="openid-selector/js/openid-jquery.js"></script>
  <script type="text/javascript" src="openid-selector/js/openid-en.js"></script>
  <link type="text/css" rel="stylesheet" href="openid-selector/css/openid.css" />
  <link href="http://fonts.googleapis.com/css?family=Bevan:regular" media="all" type="text/css" rel="stylesheet" />
  <link href="http://fonts.googleapis.com/css?family=Ubuntu:regular,bold&amp;subset=Latin" media="all" type="text/css" rel="stylesheet" />
  <link href="css/style.css" media="all" type="text/css" rel="stylesheet" />
<script type="text/javascript">
$(document).ready(function() {
<?php if(!$CONFIG['singleplayer_enabled']) {?>
  <?php if(!isset($_SESSION['openid'])) {?>
	openid.init('openid_identifier');
  <?php } else { ?>
	$('#login-form').submit(function() {
		var name = $(this).find('#name').val();
		var g = new Game(name);
		Object.seal(g);
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
<?php } ?>
});
</script>
</head>

<body id="page">
  <div id="container">
  
    <header>
      <h1>Tetrinet</h1>
    </header>

    <div id="login">
      <?php if(!$CONFIG['singleplayer_enabled'] && !isset($_SESSION['openid'])) {?>
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
      <form action="/" method="get" id="login-form">
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
        <div id="gamelog"></div>
      </div>
    </div>

  </div>
</body>
</html>