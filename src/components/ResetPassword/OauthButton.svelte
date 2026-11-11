<script>
	import Button from '../Common/Button.svelte';
	import steamSvg from '../../resources/steam.svg';
	import {OAUTH_URL, getToken} from './api';

	export let provider;

	const STYLES = {
		Steam: {type: 'primary', icon: steamSvg},
		Discord: {type: 'blurple', iconFa: 'fab fa-discord'},
		Patreon: {type: 'patreon', iconFa: 'fab fa-patreon'},
		YouTube: {type: 'danger', iconFa: 'fab fa-youtube'},
		GitHub: {type: 'github', iconFa: 'fab fa-github'},
		Twitter: {type: 'twitter', iconFa: 'fab fa-twitter'},
		Twitch: {type: 'twitch', iconFa: 'fab fa-twitch'},
	};
</script>

<form action={OAUTH_URL} method="post">
	<input type="hidden" name="token" value={getToken()} />
	<input type="hidden" name="provider" value={provider} />
	<input type="hidden" name="returnUrl" value="{location.origin}/reset-password" />
	<Button {...STYLES[provider]} label="Sign in with {provider}" noMargin={true} />
</form>
