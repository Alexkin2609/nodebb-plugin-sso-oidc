(function (module) {
    'use strict';

    var user = require.main.require('./src/user'),
        meta = require.main.require('./src/meta'),
        db = require.main.require('./src/database'),
        passport = require.main.require('passport'),
        passportOpenID = require('passport-openidconnect').Strategy,
        nconf = require.main.require('nconf'),
        async = require.main.require('async'),
        winston = require.main.require('winston');

    var authenticationController = require.main.require('./src/controllers/authentication');

	var constants = Object.freeze({
		'name': 'OIDC',
		'admin': {
            'route': '/plugins/sso-oidc',
			'icon': 'fa-openid'
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
		winston.info('Setting up OpenID Connect UI routes...');

        var hostHelpers = require.main.require('./src/routes/helpers');

		function render(req, res, next) {
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
		
		/*
		params.router.post('/deauth/oidc', [params.middleware.requireUser, params.middleware.applyCSRF], function (req, res, next) {
			Oidc.deleteUserData({
				uid: req.user.uid,
			}, function (err) {
				if (err) {
					return next(err);
				}

				res.redirect(nconf.get('relative_path') + '/me/edit');
			});
		});
		*/

		meta.settings.get('sso-oidc', function (err, settings) {
			Oidc.settings = settings;
			callback();
		});
    };

    /**
    *   Creates the Passport Strategy to login with OpenID Connect.
    *
    *   @param {Array} strategies
    *   @param {Function} callback
    */
    Oidc.getStrategy = function (strategies, callback) {
        winston.info('Setting up openid strategy');
        if (Oidc.settings.client_id && Oidc.settings.client_secret) {
            passport.use(new passportOpenID({
                issuer: 'https://toid.tergar.org',
                authorizationURL: 'https://toid.tergar.org/oxauth/restv1/authorize',
                tokenURL: 'https://toid.tergar.org/oxauth/restv1/token',
                userInfoURL: 'https://toid.tergar.org/oxauth/restv1/userinfo',
                clientID: Oidc.settings.client_id,
                clientSecret: Oidc.settings.client_secret,
                callbackURL: nconf.get('url') + '/auth/oidc/callback',
                scope: 'openid email profile',
                passReqToCallback: true,
            }, function (req, iss, sub, profile, accessToken, refreshToken, verified) {
				if (req.hasOwnProperty('user') && req.user.hasOwnProperty('uid') && req.user.uid > 0) {
					// Save specific information to the user
					winston.info('entering to has own property');
					User.setUserField(req.user.uid, 'oidcid', profile.id);
					db.setObjectField('oidcid:uid', profile.id, req.user.uid);
					return verified(null, req.user);
				}

				Oidc.login(profile.id, profile._json.user_name, profile._json.email, function (err, user) {
					winston.info('Login user...');
					if (err) {
						return verified(err);
					}

					authenticationController.onSuccessfulLogin(req, user.uid);
					verified(null, user);
				});

            }));

            strategies.push({
                name: 'openidconnect',
                url: '/auth/oidc',
                callbackURL: '/auth/oidc/callback',
				icon: constants.admin.icon,
				checkState: false
            });
        }
        callback(null, strategies);
    };

    Oidc.login = function (oidcid, username, email, callback) {
		winston.info('Entering to login function...');
		Oidc.getUidByOidc(oidcid, function (err, uid) {
			if (err) {
				return callback(err);
			}

			if (uid !== null) {
				// Existing user
				winston.info('User found inside get uid by oidc function');
				callback(null, {
					uid: uid
				});
			} else {
				// New User
				var success = function (uid) {
					// Save specific information to the user
					winston.info('Saving user information...');
					user.setUserField(uid, 'oidcid', oidcid);
					db.setObjectField('oidcid:uid', oidcid, uid);

					callback(null, {
						uid: uid
					});
				};

				user.getUidByEmail(email, function (err, uid) {
					if (err) {
						return callback(err);
					}

					if (!uid) {
                        username = username.split("@");
						winston.info('Creating user...');
						user.create({ username: username[0], email: email }, function (err, uid) {
							if (err) {
								return callback(err);
							}

							success(uid);
						});
					} else {
						winston.info('User found inside get uid by email function');
						success(uid);
					}
				});
			}
		});
    };

    Oidc.addMenuItem = function(custom_header, callback) {
		custom_header.authentication.push({
			'route': constants.admin.route,
			'icon': constants.admin.icon,
			'name': constants.name
		});

		callback(null, custom_header);
    };

    Oidc.getUidByOidc = function (oidcid, callback) {
		db.getObjectField('oidcid:uid', oidcid, function (err, uid) {
			if (err) {
				return callback(err);
			}
			callback(null, uid);
		});
    };

    /*
    Oidc.deleteUserData = function (data, callback) {
        var uid = data.uid;

        async.waterfall([
            async.apply(User.getUserField, uid, 'gplusid'),
            function (oAuthIdToDelete, next) {
                db.deleteObjectField('gplusid:uid', oAuthIdToDelete, next);
            },
            function (next) {
                db.deleteObjectField('user:' + uid, 'gplusid', next);
            },
        ], function (err) {
            if (err) {
                winston.error('[sso-google] Could not remove OAuthId data for uid ' + uid + '. Error: ' + err);
                return callback(err);
            }
            callback(null, uid);
        });
    };
    */

	module.exports = Oidc;
}(module));