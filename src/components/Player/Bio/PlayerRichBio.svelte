<script>
	import {createEventDispatcher, onMount} from 'svelte';
	import {Svrollbar} from 'svrollbar';
	import {BL_ASSETS_CDN} from '../../../network/queues/beatleader/page-queue';
	import Button from '../../Common/Button.svelte';
	import RichTextEditor2 from '../../Common/RichTextEditor2.svelte';
	import {defaultBio} from './placeholder_bio';

	export let richBioID;
	export let playerId;
	export let edit;
	export let patron;

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
		if (event.origin === location.origin) {
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

	$: richBioID && fetchBioFile(richBioID);
	$: container && subscribeToContainer(container);
</script>

{#if richBio?.length || edititing || edit}
	<div class="bio-container">
		{#if richBio?.length || edititing}
			<div class="message" bind:this={container}>
				{#if !edititing || !edit}
					<iframe
						bind:this={viewport}
						class="message-body"
						srcdoc={`<html>
							<style>
								html {
									overflow-x: hidden;
									overflow-y: auto;
									-ms-overflow-style: none;
									scrollbar-width: none;
									width: ${width}px;
								}
								html::-webkit-scrollbar {
									display: none;
								}
							</style>
							<script>function sendHeight() {
								var height = document.body.clientHeight;
								window.parent.postMessage({
									'frameHeight': height
								}, '*');
							}
							
							window.onload = sendHeight;  // Send initial height
							window.onresize = sendHeight;  // Update height on resize
						</script>
					${richBio}
           			</html>`} />
				{:else}
					<RichTextEditor2 initialValue={richBio} on:cancel={() => updateEditing(false)} on:post={editComment} />
				{/if}
				<Svrollbar {viewport} />
			</div>
		{/if}

		{#if !edititing && edit}
			{#if !richBio?.length}
				<div class="sample-bio">
					<RichTextEditor2 initialValue={defaultBio} />
				</div>
			{/if}
			{#if !patron}
				<span> Support us on <a href="https://patreon.com/beatleader">Patreon</a></span>
			{/if}
			<div class="action-buttons">
				<div>
					{#if richBio?.length}
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
		background-color: #121212;
		border-radius: 8px;
		overflow: auto;
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

	.message {
		background-color: transparent;
		position: relative;
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
	}

	.sample-bio {
		opacity: 0.6;
		pointer-events: none;
	}

	:global(.message-header .button) {
		width: 2em !important;
		height: 2em !important;
		margin-bottom: -0.3em !important;
		margin-top: -0.4em !important;
	}

	:global(.se-btn-group) {
		background-color: black !important;
	}
	:global(.se-input-control) {
		background-color: black !important;
	}
	:global(.se-wrapper-inner) {
		background-color: transparent !important;
		color: white !important;
	}
	:global(.se-resizing-bar) {
		background-color: black !important;
	}

	:global(.sample-bio .se-wrapper-inner) {
		height: auto !important;
		background-color: transparent !important;
	}
</style>
