<div class="row">
	<div class="col-xs-12">
		<div class="panel panel-default">
			<div class="panel-heading">OpenID Connect Authentication</div>
			<div class="panel-body">
				<p>
					Use your <strong>OpenID Connect Client</strong> data
					from the OpenID Connect server and then paste your
					client details here.
				</p>
				<ul>
					<li>
						You will need to paste <code>{baseUrl}/auth/oidc/callback</code> into the
						<strong>"Redirect URIs"</strong> field on your OpenID Connect Server.
					</li>
					<li>
						Fields with asterisk (<code>*</code>) are required.
					</li>
				</ul>
				<form role="form" class="sso-oidc-settings">
					<div class="form-group">
						<label for="client_id"><code>*</code> Client ID</label>
						<input type="text" id="client_id" name="client_id" title="Client ID" class="form-control" placeholder="Client ID">
					</div>
					<div class="form-group">
						<label for="client_secret"><code>*</code> Client Secret</label>
						<input type="text" id="client_secret" name="client_secret" title="Client Secret" class="form-control" placeholder="Client Secret">
					</div>
					<div class="form-group">
						<label for="base_url"><code>*</code> OpenID Connect Provider Base URL (Issuer)</label>
						<input type="text" id="base_url" name="base_url" title="Base URL" class="form-control" placeholder="https://my.domain.com">
					</div>
					<div class="form-group">
						<label for="login_authorize"><code>*</code> Authorization Endpoint</label>
						<input type="text" id="login_authorize" name="login_authorize" title="Authorization" class="form-control" placeholder="https://my.domain.com/authorize">
					</div>
					<div class="form-group">
						<label for="token"><code>*</code> Token Validation Endpoint</label>
						<input type="text" id="token" name="token" title="Token Validation" class="form-control" placeholder="https://my.domain.com/token">
					</div>
					<div class="form-group">
						<label for="user_info"><code>*</code> UserInfo Endpoint</label>
						<input type="text" id="user_info" name="user_info" title="UserInfo" class="form-control" placeholder="https://my.domain.com/userinfo">
					</div>
					<p class="help-block">
						Restricting registration means that only registered users can associate their account with this SSO strategy.
						This restriction is useful if you have users bypassing registration controls by using OpenID Connect accounts, or
						if you wish to use the NodeBB registration queue.
					</p>
				</form>
			</div>
		</div>
	</div>
</div>

<button id="save" class="floating-button mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored">
	<i class="material-icons">save</i>
</button>