var Config = {

	HOST:					'localhost',
	BASE_HREF:				'http://localhost/tetrinet/www/',
	OPENID_ENABLED:			false,
	MYSQL_ENABLED:			false,
	MYSQL_LOGIN_DATA:		{
								// Use either host and port fom tcp or just port for socket.
								//host:		'host.com',
								port:		'/var/run/mysqld/mysqld.sock',
								database:	'tetrinet',
								user:		'tetrinet',
								password:	'password'
							}
};

if (typeof(module) !== 'undefined')
    module.exports = Config;