<script>
	import createPlayerService from '../../services/beatleader/player';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
	import Avatar from '../Common/Avatar.svelte';
	import {dateFromUnix, formatDate, formatDateRelative, getTimeStringColor, WEEKSECONDS} from '../../utils/date';
	import {navigate} from 'svelte-routing';
	import {createEventDispatcher, onMount} from 'svelte';
	import Button from '../Common/Button.svelte';
	import RichTextRedactor from '../Common/RichTextRedactor.svelte';

	export let clan;
	export let isFounder;

	const dispatch = createEventDispatcher();

	function deleteComment() {
		dispatch('edit', {value: ''});
	}

	function editComment(event) {
		edit = false;
		dispatch('edit', {value: event.detail});
	}

	let richBio = null;

	function fetchBioFile(clan) {
		if (!clan.richBioTimeset) {
			richBio = null;
			return;
		}
		fetch(`${BL_ASSETS_CDN}/clan-${clan.tag}-richbio-${clan.richBioTimeset}.html`)
			.then(d => d.text())
			.then(bio => {
				richBio = bio;
			});
	}

	let edit = false;

	$: fetchBioFile(clan);

	// $: retrievePlayer(comment.playerId);
</script>

<div class="message">
	<!-- <div class="message-header">
		<div class="sender">
			<Avatar player={commentator} />
			<PlayerNameWithFlag player={commentator} on:click={commentator ? () => navigateToPlayer(commentator.playerId) : null} />
			<div class="timeset">
				<span style="color: {getTimeStringColor(comment.timeset)}; ">
					{formatDateRelative(dateFromUnix(comment.timeset))}
				</span>
			</div>
			{#if comment.edited}
				<span title={formatDateRelative(dateFromUnix(comment.editTimeset))}>(Edited)</span>
			{/if}
		</div>
		
	</div> -->

	{#if !edit}
		<div class="message-body sun-editor-editable">
			{@html richBio ?? 'Add rich bio'}
		</div>
	{:else}
		<RichTextRedactor
			initialValue={richBio}
			buttonName="Save"
			iconFa="fas fa-check"
			cancel={true}
			on:cancel={() => (edit = false)}
			on:post={editComment} />
	{/if}
</div>

{#if isFounder && !edit}
	<div class="action-buttons">
		{#if clan.richBio?.length}
			<Button type="danger" title="Delete" iconFa="fas fa-trash" on:click={deleteComment} />
		{/if}
		<Button type="primary" title="Edit" iconFa="fas fa-edit" on:click={() => (edit = !edit)} />
	</div>
{/if}

<style>
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
	}

	.message-body {
		background-color: transparent;
		color: white;
		font-family: inherit;
	}

	:global(.message-header .button) {
		width: 2em !important;
		height: 2em !important;
		margin-bottom: -0.3em !important;
		margin-top: -0.4em !important;
	}
</style>
