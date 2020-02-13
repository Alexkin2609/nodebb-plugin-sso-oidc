'use strict';

$(window).on('action:script.load', function (ev, data) {
	data.scripts.push('sso-oidc/login');
});

define('sso-oidc/login', function () {
	var Login = {};

	Login.init = function () {
		var replaceEl = $('.alt-logins .oidc a i');
		var replacement = document.createElement('div');
		var image = document.createElement('img');
		image.src = config.relative_path + '/plugins/nodebb-plugin-sso-oidc/images/logotipo-tergar-horizontal.svg';
		replaceEl.replaceWith(replacement);
		replacement.appendChild(image);
		$('<span>Continue with Tergar OpenID</span>').appendTo(replacement);
	}

	return Login;
})