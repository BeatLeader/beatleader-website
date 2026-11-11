<script>
	import {createEventDispatcher} from 'svelte';
	import Button from '../Common/Button.svelte';
	import steamSvg from '../../resources/steam.svg';
	import {CURRENT_URL, BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import {session} from './api';

	const dispatch = createEventDispatcher();
</script>

{#if $session.platform == 'steam'}
	<h2 class="title is-5">This Steam profile has no password</h2>
	<p><b>Logging in on the website?</b> Use Steam, you don't have to own the game there.</p>
	<form action={BL_API_URL + 'signin'} method="post">
		<input type="hidden" name="Provider" value="Steam" />
		<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/signin/addHome'} />
		<Button type="primary" icon={steamSvg} label="Log in with Steam" noMargin={true} />
	</form>
	<p>
		<b>Can't log in on Quest?</b> An account made in the Quest mod is a separate profile until it's merged into this one.
		<button class="link" on:click={() => dispatch('search')}>Find it</button> to reset its password.
	</p>
	<p>
		<b>Starting on Quest?</b> Sign up in the preferences of the Quest mod, then log in here with Steam and merge the new account into this
		profile on the <a href="/signin">log in page</a>.
	</p>
{:else if $session.platform == 'oculuspc'}
	<h2 class="title is-5">This Oculus PC profile has no website login yet</h2>
	<p>
		In the PC game the mod logs in by itself. To log in on the website, link the profile to Steam or to a new login and password first:
		<a href="https://beatleader.wiki/en/accounts/signup#oculus-pc" target="_blank" rel="noreferrer">how to link an Oculus PC profile</a>.
	</p>
{:else if $session.platform == 'beatsaver'}
	<h2 class="title is-5">This mapper profile has no password</h2>
	<p>It logs in with the BeatSaver account it was made from: on the <a href="/signin">log in page</a>, open "Are you a mapper?".</p>
{:else}
	<h2 class="title is-5">This profile has no login</h2>
	<p>We couldn't find a login and password for it. Contact the staff, they'll sort it out.</p>
{/if}
