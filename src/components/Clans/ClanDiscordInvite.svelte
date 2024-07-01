<script>
	import createPlayerService from '../../services/beatleader/player';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
	import Avatar from '../Common/Avatar.svelte';
	import {dateFromUnix, formatDate, formatDateRelative, getTimeStringColor, WEEKSECONDS} from '../../utils/date';
	import {navigate} from 'svelte-routing';
	import {createEventDispatcher, onMount} from 'svelte';
	import Button from '../Common/Button.svelte';
	import RichTextRedactor from '../Common/RichTextRedactor.svelte';
	import DiscordInvite from './DiscordInvite.svelte';

	export let clan;
	export let isFounder;
	export let enableCreateMode;

	const dispatch = createEventDispatcher();

	function deleteComment() {
		dispatch('edit', {value: ''});
	}

	let edit = enableCreateMode;
	let discordInvite = '';

	function updateInviteValue(clan) {
		if (clan) {
			discordInvite = clan.discordInvite;
		}
	}

	$: updateInviteValue(clan);

	// $: retrievePlayer(comment.playerId);
</script>

{#if !edit}
	<DiscordInvite inviteLink={clan.discordInvite} introText="JOIN CLAN'S DISCORD SERVER" />
{:else}
	<div class="invite-edit-container">
		<span>Add your clan's server Discord invite:</span>
		<input type="text" bind:value={discordInvite} placeholder="Example: https://discord.gg/2RG5YVqtG6" />

		<div class="edit-buttons">
			{#if !enableCreateMode}
				<Button
					type="danger"
					disabled={clan.discordInvite == discordInvite}
					title="Cancel"
					iconFa="fas fa-trash"
					on:click={() => {
						discordInvite = clan.discordInvite;
						edit = false;
					}} />
			{/if}
			<Button
				type="primary"
				disabled={clan.discordInvite == discordInvite}
				title="Save"
				iconFa="fas fa-edit"
				on:click={() => {
					edit = false;
					dispatch('edit', {value: discordInvite});
				}} />
		</div>
	</div>
{/if}

{#if isFounder && !edit}
	<div class="action-buttons">
		{#if clan.discordInvite?.length}
			<Button type="danger" title="Delete" iconFa="fas fa-trash" on:click={deleteComment} />
		{/if}
		<Button type="primary" title="Edit" iconFa="fas fa-edit" on:click={() => (edit = !edit)} />
	</div>
{/if}

<!-- <div class="message">

	{#if !edit}
		<div class="message-body sun-editor-editable">
			{@html clan.richBio ?? 'Add rich bio'}
		</div>
	{:else}
		<RichTextRedactor
			initialValue={clan.richBio}
			buttonName="Save"
			iconFa="fas fa-check"
			cancel={true}
			on:cancel={() => (edit = false)}
			on:post={editComment} />
	{/if}
</div>

 -->

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

	.edit-buttons {
		display: flex;
		gap: 1em;
	}

	.invite-edit-container {
		display: flex;
		flex-direction: column;
	}

	:global(.message-header .button) {
		width: 2em !important;
		height: 2em !important;
		margin-bottom: -0.3em !important;
		margin-top: -0.4em !important;
	}
</style>
