<script>
	import {slide, crossfade} from 'svelte/transition';
	import Spinner from '../Common/Spinner.svelte';
	import createBeatSaverService from '../../services/beatmaps';
	import {getNotificationsContext} from 'svelte-notifications';
	import Button from '../Common/Button.svelte';

	export let opened = false;
	let title = 'Dev Menu';
	export let faicon = 'fas fa-hashtag';
	export let leaderboard = null;
	export let song = null;

	const [send, receive] = crossfade({
		duration: 300,
		fallback(node, params) {
			return slide(node, {duration: 300});
		},
	});

	function boolflip() {
		opened = !opened;
	}

	let latestHash;
	let downloadLink = null;
	const {addNotification} = getNotificationsContext();

	async function checkMapHash(hash) {
		if (hash) {
			let beatSaverService = createBeatSaverService();

			const songInfoValue = await beatSaverService.byHash(hash, true);

			latestHash = songInfoValue?.versions[0].hash.toLowerCase() == hash.toLowerCase();
			if (latestHash) {
				downloadLink = songInfoValue?.versions[0].downloadURL;
			} else {
				downloadLink = `https://cdn.beatsaver.com/${hash}.zip`;
			}
		}
	}

	function successToast(text) {
		addNotification({
			text: text,
			position: 'top-right',
			type: 'success',
			removeAfter: 2000,
		});
	}
	function copyToClipboard() {
		var dummy = document.createElement('input');
		var text = song.hash.toLowerCase();

		document.body.appendChild(dummy);
		dummy.value = text;
		dummy.select();
		document.execCommand('copy');
		document.body.removeChild(dummy);

		successToast('Hash Copied to Clipboard!');
	}

	$: song && song.hash.length == 40 && checkMapHash(song.hash);
</script>

<div class="dev-menu-container">
	<div class="box-toggle-section">
		{#if !opened}
			<span
				class="reveal-button clickable"
				style="height: 1.5em;"
				on:click={() => boolflip()}
				title="Show {title}"
				in:receive={{key: 'button'}}
				out:send={{key: 'button'}}>
				<i class="fas fa-chevron-down" />
				<i class={faicon} />
				<span>{title}</span>
			</span>
		{:else}
			<span
				class="reveal-button clickable"
				on:click={() => boolflip()}
				title="Hide {title}"
				in:receive={{key: 'button'}}
				out:send={{key: 'button'}}>
				<i class="fas fa-chevron-up" />
				<i class={faicon} />
				<span>{title}</span>
			</span>
		{/if}
	</div>

	{#if opened && song && song.hash.length == 40}
		<div class="aside-box" transition:slide>
			<div class="dev-background">
				{#if downloadLink}
					<a href={downloadLink} target="_blank" rel="noreferrer" class="map-download-button">
						<Button iconFa="fas fa-download" square={true} squareSize="1.4em" noMargin={true} />
					</a>
				{/if}
				Hash: <small on:click={() => copyToClipboard()} title="Click to copy to clipboard">{song.hash.toUpperCase()}</small>
				{#if latestHash}
					<i class="fa fa-check" style="color: lime; margin-left: 0.1em; margin-right: -0.1em;" title="Latest map version" />
				{:else if latestHash == undefined}
					<Spinner />
				{:else}
					<i class="fa fa-xmark" style="color: red; margin-left: 0.1em; margin-right: -0.1em;" title="Outdated map" />
				{/if}
				<br />
			</div>
		</div>
	{/if}
</div>

<style>
	.dev-menu-container {
		width: 100%;
		background-color: var(--foreground);
		border-radius: 0.3em;
		padding: 0.25em;
		margin-top: 0.5em;
	}

	.box-toggle-section {
		display: grid;
		grid-template-areas: 'button'; /* Single grid area */
		justify-items: center;
		min-width: max-content;
		gap: 0.25em;
	}

	.reveal-button {
		grid-area: button; /* Assign to the same grid area */
		align-self: end;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.aside-box {
		display: flex;
		align-items: center;
		gap: 0.25em;
		margin-top: 0.25em;
	}

	.dev-background {
		display: flex;
		padding: 0.4em;
		border-radius: 0.5em;
		background-color: #393939;
		height: fit-content;
		font-size: 0.97em;
		align-items: center;
		gap: 0.24em;
	}

	.dev-background small {
		font-size: 0.78em;
		margin-bottom: -0.3em;
	}

	.map-download-button {
		margin-top: 0.1em;
	}

	:global(.map-download-button .fa-download) {
		font-size: 0.8em;
	}
</style>
