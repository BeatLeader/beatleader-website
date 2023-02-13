<script>
	import createPlayerService from '../../../services/beatleader/player';
	import PlayerNameWithFlag from '../../Common/PlayerNameWithFlag.svelte';
	import Avatar from '../../Common/Avatar.svelte';
	import {dateFromUnix, formatDate, formatDateRelative, getTimeStringColor, WEEKSECONDS} from '../../../utils/date';
	import {navigate} from 'svelte-routing';
	import {createEventDispatcher, onMount} from 'svelte';
	import Button from '../../Common/Button.svelte';
	import CommentRedactor from './CommentRedactor.svelte';

	export let comment;

	const playerService = createPlayerService();
	const dispatch = createEventDispatcher();

	let commentator;

	async function retrievePlayer(playerId) {
		commentator = await playerService.fetchPlayerOrGetFromCache(playerId);
	}

	function navigateToPlayer(playerId) {
		if (!playerId) return;

		navigate(`/u/${playerId}`);
	}

	function deleteComment() {
		dispatch('delete', comment.id);
	}

	function editComment(event) {
		edit = false;
		dispatch('edit', {id: comment.id, value: event.detail});
	}

	let edit = false;

	$: retrievePlayer(comment.playerId);
</script>

<div class="message">
	<div class="message-header">
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
		<div class="hover-buttons">
			<Button type="danger" title="Delete comment" iconFa="fas fa-trash" on:click={deleteComment} />
			<Button type="primary" title="Edit comment" iconFa="fas fa-edit" on:click={() => (edit = !edit)} />
		</div>
	</div>

	{#if !edit}
		<div class="message-body sun-editor-editable">
			{@html comment.value}
		</div>
	{:else}
		<CommentRedactor
			initialValue={comment.value}
			buttonName="Accept"
			cancel={true}
			on:cancel={() => (edit = false)}
			on:post={editComment} />
	{/if}
</div>

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

	:global(.message-header .button) {
		width: 2em !important;
		height: 2em !important;
		margin-bottom: -0.3em !important;
		margin-top: -0.4em !important;
	}
</style>
