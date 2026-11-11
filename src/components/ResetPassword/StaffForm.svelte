<script>
	import {createEventDispatcher} from 'svelte';
	import Button from '../Common/Button.svelte';
	import Select from '../Settings/Select.svelte';
	import {session, sendRequest, PLATFORM_NAMES, DISCORD_INVITE, DISCORD_HELP_CHANNEL} from './api';

	const dispatch = createEventDispatcher();

	const PLATFORMS = ['Quest', 'Steam', 'Oculus PC', 'Not sure'].map(name => ({name, value: name}));

	const player = $session?.player;
	const openRequest = $session?.request?.status == 'open' ? $session.request : null;

	// Prefilled from the earlier steps, the staff also sees everything tried on the page
	let profile = '';
	let platform = PLATFORMS.find(p => p.name == PLATFORM_NAMES[$session?.platform])?.value ?? 'Not sure';
	let login = $session?.loginTried ?? '';
	let contact = openRequest?.contact || ($session?.identityProvider == 'Discord' && $session.identityName) || '';
	let message = openRequest?.message ?? '';
	let sending = false;
	let sent = false;
	let error = null;

	async function send() {
		sending = true;
		error = null;
		try {
			await sendRequest({profile: player ? null : profile, platform, login, contact, message});
			sent = true;
		} catch (e) {
			error = e.message;
		}
		sending = false;
	}
</script>

{#if sent}
	<h2 class="title is-5">Request #{$session.request?.id} sent</h2>
	<p>The staff will look at it. The answer shows up on this page in this browser, so come back here later.</p>
	<Button type="primary" label="Okay" noMargin={true} on:click={() => dispatch('close')} />
{:else}
	<h2 class="title is-5">Contact the staff</h2>
	<p>Tell us what's going on and a person will look at it. They also see what you tried on this page.</p>

	<form class="flow staff" on:submit|preventDefault={send}>
		<label>
			<span class="caption">Profile</span>
			{#if player}
				<input type="text" value="{player.name} ({player.id})" disabled />
			{:else}
				<input type="text" placeholder="Profile name, link or ID" maxlength="200" bind:value={profile} />
			{/if}
		</label>
		<div class="columns-row">
			<div>
				<span class="caption">Platform you play on</span>
				<Select bind:value={platform} options={PLATFORMS} />
			</div>
			<label>
				<span class="caption">Login you try to use</span>
				<input type="text" autocapitalize="off" maxlength="100" bind:value={login} />
			</label>
		</div>
		<label>
			<span class="caption">Discord username or another way to reach you</span>
			<input type="text" placeholder="Optional" maxlength="100" bind:value={contact} />
		</label>
		<label>
			<span class="caption">What happened?</span>
			<textarea placeholder="What you tried, what the mod or the website says, anything that shows the profile is yours" maxlength="2000" bind:value={message}></textarea>
		</label>
		{#if error}
			<p class="bad">{error}</p>
		{/if}
		<div class="row">
			<Button
				type="primary"
				iconFa="fas fa-paper-plane"
				label={openRequest ? 'Update the request' : 'Send to the staff'}
				loading={sending}
				disabled={sending || !message.trim()}
				noMargin={true} />
			<Button label="Back" noMargin={true} on:click={() => dispatch('close')} />
		</div>
	</form>

	<p class="inset">
		<i class="fab fa-discord"></i> <b>Urgent, or just a question?</b> Ask in
		<a href={DISCORD_HELP_CHANNEL} target="_blank" rel="noreferrer">#help</a> on
		<a href={DISCORD_INVITE} target="_blank" rel="noreferrer">our Discord server</a>. Don't post your password or reset links there.
	</p>
{/if}

<style>
	.staff,
	.staff label,
	.staff input,
	.staff textarea {
		align-self: stretch;
		width: 100%;
	}

	.staff label,
	.columns-row > div {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
	}

	.columns-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75em;
		align-self: stretch;
	}

	.columns-row > * {
		flex: 1;
		min-width: 12em;
	}

	.caption {
		color: var(--faded);
		font-size: 0.75em;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	textarea {
		height: 7em;
		resize: vertical;
	}

	.inset {
		align-self: stretch;
	}
</style>
