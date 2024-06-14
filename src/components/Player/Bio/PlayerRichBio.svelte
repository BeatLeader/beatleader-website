<script>
	import {createEventDispatcher} from 'svelte';
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
				dispatch('height-changed');
				richBio = bio;
			});
	}

	let edititing = false;
	let viewport;

	$: richBioID && fetchBioFile(richBioID);
</script>

{#if richBio?.length || edititing || edit}
	<div class="bio-container">
		{#if richBio?.length || edititing}
			<div class="message">
				{#if !edititing || !edit}
					<div bind:this={viewport} class="message-body">
						{@html richBio ?? 'Add rich bio'}
					</div>
				{:else}
					<RichTextEditor2 initialValue={richBio} on:cancel={() => (edititing = false)} on:post={editComment} />
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
						<Button type="primary" title="Edit" disabled={!patron} iconFa="fas fa-edit" on:click={() => (edititing = !edititing)} />
					{:else}
						<Button
							type="primary"
							disabled={!patron}
							label="Add bio"
							iconFa="fas fa-file-signature"
							on:click={() => (edititing = !edititing)} />
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
		max-height: 30em;
		max-width: 100%;
		overflow: auto;
		-ms-overflow-style: none;
		scrollbar-width: none;
		position: relative;
		padding: 0;
		width: 100%;
		min-height: 6em;
	}

	.message-body::-webkit-scrollbar {
		display: none;
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
