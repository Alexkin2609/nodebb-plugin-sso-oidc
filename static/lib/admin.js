define('admin/plugins/sso-oidc', ['settings'], function(Settings) {
	'use strict';
	/* globals $, app, socket, require */

	var ACP = {};

	ACP.init = function() {
		Settings.load('sso-oidc', $('.sso-oidc-settings'));

		$('#save').on('click', function() {
			Settings.save('sso-oidc', $('.sso-oidc-settings'), function() {
				app.alert({
					type: 'success',
					alert_id: 'sso-oidc-saved',
					title: 'Settings Saved',
					message: 'Please restart your NodeBB to apply these settings',
					clickfn: function() {
						socket.emit('admin.reload');
					}
				});
			});
		});
	};

	return ACP;
});