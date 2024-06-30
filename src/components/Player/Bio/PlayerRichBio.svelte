<script>
	import {createEventDispatcher} from 'svelte';
	import {BL_ASSETS_CDN} from '../../../network/queues/beatleader/page-queue';
	import {configStore} from '../../../stores/config';
	import Button from '../../Common/Button.svelte';
	import Editor from '../../Common/GrapesJS/Editor.svelte';
	import {defaultBio} from './placeholder_bio';

	export let richBioID;
	export let playerId;
	export let editModel;
	export let patron;
	export let vertical;

	const dispatch = createEventDispatcher();

	function deleteComment() {
		edititing = false;
		dispatch('delete', {});
	}

	function editComment(event) {
		edititing = false;
		dispatch('edit', {value: event.detail});
	}

	let richBio = null;

	function fetchBioFile(richBioID) {
		fetch(`${BL_ASSETS_CDN}/player-${playerId}-richbio-${richBioID}.html`)
			.then(d => d.text())
			.then(bio => {
				richBio = bio;
				dispatch('height-changed');
			});
	}

	let edititing = false;
	function updateEditing(newValue) {
		edititing = newValue;
		dispatch('height-changed');
	}

	let container;
	let viewport;

	window.addEventListener('message', function (event) {
		if (event.origin === 'https://bio.beatleader.pro') {
			var newHeight = event.data.frameHeight;
			viewport.style.height = Math.min(newHeight, 420) + 'px';
			dispatch('height-changed');
		}
	});

	let width = 0;

	function subscribeToContainer(container) {
		const resizeObserver = new ResizeObserver(entries => {
			for (let entry of entries) {
				width = entry.contentRect.width;
			}
		});

		resizeObserver.observe(container);
	}

	let iframeUrl = '';

	function formIframeUrl(playerId, richBioID, width, preferences) {
		let base = `https://bio.beatleader.pro/?player=${playerId}&timeset=${richBioID}&width=${width}`;
		['theme', 'bgColor', 'headerColor', 'buttonColor', 'labelColor', 'ppColor', 'selectedColor'].forEach(key => {
			base += `&${key}=${preferences[key]}`;
		});
		iframeUrl = base;
	}

	$: richBioID && editModel && fetchBioFile(richBioID);
	$: formIframeUrl(playerId, richBioID, width, $configStore.preferences);
	$: container && subscribeToContainer(container);
	$: setTimeout(() => {
		dispatch('height-changed');
	}, 400);
</script>

{#if richBioID || edititing || editModel}
	<div class="bio-container">
		{#if richBioID || edititing}
			{#if !edititing || !editModel}
				<iframe bind:this={viewport} class="message-body" allow="fullscreen;" src={iframeUrl} />
			{:else}
				<Editor initialValue={richBio} {vertical} on:cancel={() => updateEditing(false)} on:post={editComment} />
			{/if}
		{/if}

		{#if !edititing && editModel}
			{#if !richBioID}
				<div class="sample-bio">
					<Editor initialValue={defaultBio} />
				</div>
			{/if}
			{#if !patron}
				<span class="patreon-line"> Support us on <a href="https://patreon.com/beatleader">Patreon</a></span>
			{/if}
			<div class="action-buttons">
				<div>
					{#if richBioID}
						<Button type="danger" title="Delete" iconFa="fas fa-trash" on:click={deleteComment} />
						<Button type="primary" title="Edit" disabled={!patron} iconFa="fas fa-edit" on:click={() => updateEditing(!edititing)} />
					{:else}
						<Button
							type="primary"
							disabled={!patron}
							label="Add bio"
							iconFa="fas fa-file-signature"
							on:click={() => updateEditing(!edititing)} />
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.bio-container {
		border-radius: 8px;
		overflow: hidden;
		height: min-content;
	}
	.message-header {
		display: flex;
	}
	.hover-buttons {
		display: none;
	}

	.sender {
		display: flex;
		grid-gap: 0.8em;
	}

	.message-header:hover .hover-buttons {
		display: block;
	}

	.message-body {
		background-color: transparent;
		color: white;
		font-family: inherit;
		max-width: 100%;

		position: relative;
		padding: 0;
		width: 100%;
		min-height: 6em;
		margin-bottom: -0.5em;
	}

	.sample-bio {
		opacity: 0.3;
		pointer-events: none;
		height: 15em;
		overflow: hidden;
		margin-bottom: 0.5em;
	}

	.patreon-line {
		margin-left: 0.5em;
	}

	.action-buttons {
		margin-left: 0.5em;
	}
</style>
