(function (module) {
	'use strict';
    /* globals module, require */

    var passport = module.parent.require('passport'),
        nconf = module.parent.require('nconf'),
        winston = module.parent.require('winston'),
        { Issuer, Strategy, custom } = require('openid-client'),
        AUTH_OIDC_BASE_PATH = '/auth/oidc',
        AUTH_OIDC_LOGIN_PATH = `${AUTH_OIDC_BASE_PATH}/login`,
        AUTH_OIDC_CALLBACK_PATH = `${AUTH_OIDC_BASE_PATH}/callback`,
        CLOCK_TOLERANCE = 10,
        controllers = require('./lib/controllers'),
        { UserHelper, SettingsHelper } = require('./lib/helpers');

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
    *   @param {Object} data
    *   @param {Function} callback
    */
    Oidc.init = function (params, callback) {
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

    Oidc.addMenuItem = function (custom_header, callback) {
		custom_header.authentication.push({
			'route': constants.admin.route,
			'icon': constants.admin.icon,
			'name': constants.name
		});

		callback(null, custom_header);
	};

	module.exports = Oidc;
}(module));