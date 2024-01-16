<script>
	import Spinner from './Spinner.svelte';
	import createBeatSaverService from '../../services/beatmaps';
	import {getNotificationsContext} from 'svelte-notifications';

	export let song;

	let latestHash;
	const {addNotification} = getNotificationsContext();

	async function checkMapHash(hash) {
		if (hash) {
			let beatSaverService = createBeatSaverService();

			const songInfoValue = await beatSaverService.byHash(hash, true);

			latestHash = songInfoValue?.versions[0].hash.toLowerCase() == hash.toLowerCase();
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

{#if song && song.hash.length == 40}
	<div>
		<small class="hash-container" title="Click to copy to clipboard" on:click={() => copyToClipboard()}>{song.hash.toUpperCase()}</small>
		{#if latestHash}
			<i class="fa fa-check" style="color: lime;" title="Latest map version" />
		{:else if latestHash == undefined}
			<Spinner />
		{:else}
			<i class="fa fa-xmark" style="color: red;" title="Outdated map" />
		{/if}
	</div>
{/if}

<style>
	.hash-container {
		display: inline-block;
		cursor: pointer !important;
	}
</style>
