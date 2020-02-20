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
				</ul>
				<form role="form" class="sso-oidc-settings">
					<div class="form-group">
						<label for="discover_url">Discover URL</label>
						<input type="text" id="discover_url" name="discover_url" title="Discover URL" class="form-control" placeholder="Discover URL">
					</div>
					<div class="form-group">
						<label for="client_id">Client ID</label>
						<input type="text" id="client_id" name="client_id" title="Client ID" class="form-control" placeholder="Client ID"><br />
					</div>
					<div class="form-group">
						<label for="client_secret">Client Secret</label>
						<input type="text" id="client_secret" name="client_secret" title="Client Secret" class="form-control" placeholder="Client Secret">
					</div>
					<div class="checkbox">
						<label for="matchUser" class="mdl-switch mdl-js-switch mdl-js-ripple-effect">
							<input type="checkbox" class="mdl-switch__input" id="matchUser" name="matchUser" />
							<span class="mdl-switch__label">Match User by Email</span>
						</label>
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