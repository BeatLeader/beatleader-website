<script>
	import {slide} from 'svelte/transition';
	import MethodPlay from './MethodPlay.svelte';
	import MethodBackground from './MethodBackground.svelte';
	import MethodReplays from './MethodReplays.svelte';
	import {session} from './api';

	export let method = null;

	function getMethods(state) {
		const loggedOutFirst = !state.declaredLoggedOut;
		return [
			{
				id: 'play',
				component: MethodPlay,
				icon: 'fas fa-vr-cardboard',
				title: 'Play a map',
				text: 'If the BeatLeader mod is logged in to this profile',
			},
			state.hintAvailable && {
				id: 'background',
				component: MethodBackground,
				icon: 'fas fa-user-check',
				title: `Your main ${state.identityProviders.join(' or ')} account`,
				text: 'We verify your account, then you reset the password',
				locked: loggedOutFirst,
			},
			{
				id: 'replays',
				component: MethodReplays,
				icon: 'fab fa-usb',
				title: 'Connect your Quest with a USB cable',
				text: 'We check the replays the mod saved on the headset',
				locked: !state.replaysAvailable && loggedOutFirst,
			},
		].filter(Boolean);
	}

	$: methods = getMethods($session);
	$: opened = methods.find(m => m.id == method && !m.locked)?.id ?? methods[0].id;
</script>

<h2 class="title is-5">Let's verify the profile is yours</h2>

<div class="methods">
	{#each methods as m (m.id)}
		<div class="method" class:opened={m.id == opened}>
			<button class="header" disabled={!!m.locked} on:click={() => (method = m.id)}>
				<i class="method-icon {m.locked ? 'fas fa-lock' : m.icon}"></i>
				<span>
					<b>{m.title}</b>
					<span class="hint">{m.text}</span>
				</span>
			</button>

			{#if m.id == opened}
				<div class="flow body" transition:slide={{duration: 200}}>
					<svelte:component this={m.component} on:next={() => (method = $session.hintAvailable ? 'background' : 'replays')} />
				</div>
			{/if}
		</div>
	{/each}
</div>

<style>
	.methods {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		align-self: stretch;
	}

	.method {
		border: 1px solid var(--dimmed);
		border-radius: 6px;
	}

	.method.opened {
		border-color: var(--selected);
	}

	.header {
		display: flex;
		align-items: center;
		gap: 0.75em;
		width: 100%;
		padding: 0.6em 0.8em;
		border: none;
		background: none;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.header:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.header > span {
		display: flex;
		flex-direction: column;
	}

	.method-icon {
		width: 1.5em;
		font-size: 1.2em;
		text-align: center;
	}

	.opened .method-icon {
		color: var(--selected);
	}

	.body {
		padding: 0 0.8em 0.8em;
	}
</style>
