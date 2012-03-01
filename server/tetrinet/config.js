var Config = {

	HOST:				'localhost',
	PORT:				7000,
	OPENID_ENABLED:		false,
	MYSQL_ENABLED:		false,
	MYSQL_LOGIN_DATA:	{
							// Use either host and port fom tcp or just port for socket.
							//host:		'host.com',
							port:		'/var/run/mysqld/mysqld.sock',
							database:	'tetrinet',
							user:		'tetrinet',
							password:	'password'
						},
	SERVER_COUNTDOWN:	5
};

if (typeof(module) !== 'undefined')
    module.exports = Config;