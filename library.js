(function (module) {
    'use strict';

    /* globals module, require */
    var user = require.main.require('./src/user'),
        meta = require.main.require('./src/meta'),
        db = require.main.require('./src/database'),
        passport = require.main.require('passport'),
        nconf = require.main.require('nconf'),
        winston = require.main.require('winston'),
        { Issuer, Strategy, custom } = require('openid-client'),
        AUTH_OIDC_BASE_PATH = '/auth/oidc',
        AUTH_OIDC_LOGIN_PATH = `${AUTH_OIDC_BASE_PATH}/login`,
        AUTH_OIDC_CALLBACK_PATH = `${AUTH_OIDC_BASE_PATH}/callback`,
        CLOCK_TOLERANCE = 10;

    var authenticationController = require.main.require('./src/controllers/authentication');

	var constants = Object.freeze({
		'name': 'OIDC',
		'admin': {
            'route': '/plugins/sso-oidc',
			'icon': 'fa-oidc-square'
		}
	});

	var Oidc = {
		settings: undefined
    };

    /**
    *   Initializes the plugin
    *
    *   @param {Object} data
    *   @param {Function} callback
    */
    Oidc.init = function(params, callback) {
		winston.verbose('Setting up OpenID Connect UI routes...');

        var hostHelpers = require.main.require('./src/routes/helpers');

		function render(req, res) {
			res.render('admin/plugins/sso-oidc', {
				baseUrl: nconf.get('url'),
			});
		}

		params.router.get('/admin/plugins/sso-oidc', params.middleware.admin.buildHeader, render);
		params.router.get('/api/admin/plugins/sso-oidc', render);

		hostHelpers.setupPageRoute(params.router, '/deauth/oidc', params.middleware, [params.middleware.requireUser], function (req, res) {
			res.render('plugins/sso-oidc/deauth', {
				service: "OIDC",
			});
		});
		params.router.post('/deauth/oidc', [params.middleware.requireUser, params.middleware.applyCSRF], function (req, res, next) {
			Facebook.deleteUserData({
				uid: req.user.uid,
			}, function (err) {
				if (err) {
					return next(err);
				}

				res.redirect(nconf.get('relative_path') + '/me/edit');
			});
		});

		callback();
    };

    Oidc.getSettings = function(callback) {
		if (Oidc.settings) {
			return callback();
		}

		meta.settings.get('sso-oidc', (err, settings) => {
			Oidc.settings = settings;
			callback();
		});
    }

    /**
    *   Creates the Passport Strategy to login with OpenID Connect.
    *
    *   @param {Array} strategies
    *   @param {Function} callback
    */
    Oidc.getStrategy = function(strategies, callback) {
        if (!Oidc.settings) {
			return Oidc.getSettings(function () {
				Oidc.getStrategy(strategies, callback);
			});
        }

        if (
            Oidc.settings !== undefined &&
            Oidc.settings.hasOwnProperty('discover_url') && Oidc.settings.discover_url &&
            Oidc.settings.hasOwnProperty('client_id') && Oidc.settings.client_id &&
            Oidc.settings.hasOwnProperty('client_secret') && Oidc.settings.client_secret
        ) {
            //To see Oidc.settings:
            winston.info('Oidc.settings:');
            winston.info(JSON.stringify(Oidc.settings));

            winston.verbose('[oidc] Fetching OpenID Connect Issuer informations ...');
            const issuer = Issuer.discover(Oidc.settings.discover_url);
            winston.verbose('[oidc] Creating OpenID Connect Passport Strategy ...');

            const client = new issuer.Client({
                client_id: Oidc.settings.client_id,
                client_secret: Oidc.settings.client_secret,
                redirect_uris: [nconf.get('url') + AUTH_OIDC_CALLBACK_PATH],
            });

            // Adding some timestamp tolerance as they may be a little different
            // if nodebb and the OpenID Connect server are on two separate
            // hosts.
            client[custom.clock_tolerance] = CLOCK_TOLERANCE;

            //To see client:
            winston.info('client:');
            winston.info(JSON.stringify(client));

            const strategy = new Strategy({
                client,
                params: {
                    // In OpenID Connect,
                    // => issuer and subject in the 'openid' scope
                    // => email in the 'email' scope
                    // => username in the 'profile' scope ( as 'preferred_username' )
                    scope: 'openid email profile'
                },
            }, function (tokenSet, profile, callback) {
                winston.info('Hasta aquí es en \'verify\'');
                winston.info(JSON.stringify(profile));
                winston.verbose('Verifing after SSO response...');
                try {
                    const claims = tokenSet.claims();
                    let uid = Oidc.getDbObjectField('oidc:uid', hash(claims.iss, subject));

                    if (config.matchUserByEmail && !uid) {
                        winston.verbose('No user found, but checking if an user with the same email exists...');
                        uid = Oidc.getUidByEmail(claims.email);
                        if (uid) {
                            winston.verbose('Found corresponding user, merging...');
                            Oidc.merge(uid, {
                                oidcIssuer: claims.iss,
                                oidcSubject: claims.sub,
                            });
                        }
                    }

                    if (uid) {
                        winston.verbose(`Found user with uid '${uid}'.`);
                        callback(null, { uid });
                        return;
                    }

                    winston.verbose(`User not found, creating new one.`);
                    uid = Oidc.create({
                        username: claims.preferred_username || claims.email,
                        email: String(claims.email).toLowerCase(),
                        oidcIssuer: claims.iss,
                        oidcSubject: claims.sub,
                    });

                    callback(null, { uid });
                } catch (err) {
                    callback(err);
                }
            });

            //To see strategy:
            winston.info('strategy:');
            winston.info(JSON.stringify(strategy));

            passport.use(strategy.name, strategy);

            strategies.push({
                name: strategy.name,
                url: AUTH_OIDC_LOGIN_PATH,
                callbackURL: AUTH_OIDC_CALLBACK_PATH,
                icon: 'fa-openid',
                scope: 'openid email profile',
            });

            winston.verbose('[oidc] Strategy initialized ...');
            return strategies;
        }
	};

    Oidc.addMenuItem = function(custom_header, callback) {
		custom_header.authentication.push({
			'route': constants.admin.route,
			'icon': constants.admin.icon,
			'name': constants.name
		});

		callback(null, custom_header);
    };
    
    Oidc.getDbObjectField = async function(key, field) {
        return new Promise((resolve, reject) => {
            db.getObjectField(key, field, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    Oidc.getUidByEmail = async function(email) {
        return user.getUidByEmail(email.toLocaleLowerCase());
    }

    Oidc.merge = async function(uid, oidc) {
        const oidchash = hash(oidc.oidcIssuer, oidc.oidcSubject);

        await user.setUserField(uid, 'oidcissuer', oidc.oidcIssuer);
        await user.setUserField(uid, 'oidcsubject', oidc.oidcSubject);
        await setDbObjectField('oidc:uid', oidchash, uid);
    }

    Oidc.create = async function(userData) {
        const uid = await new Promise((resolve, reject) => {
            user.create({
                username: userData.username,
                email: userData.email,
            }, (err, uid) => {
                if (err) {
                    return reject(err);
                }
                return resolve(uid);
            });
        });
    
        const oidchash = hash(userData.oidcIssuer, userData.oidcSubject);
    
        await User.setUserField(uid, 'oidcissuer', userData.oidcIssuer); // for display
        await User.setUserField(uid, 'oidcsubject', userData.oidcSubject); // for display
    
        // Saving
        await setDbObjectField('oidc:uid', oidchash, uid);
    
        return uid;
    }

	module.exports = Oidc;
}(module));