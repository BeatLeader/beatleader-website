<script>
	import {navigate} from 'svelte-routing';
	import {fade, fly, slide} from 'svelte/transition';
	import Button from '../components/Common/Button.svelte';
	import Pager from '../components/Common/Pager.svelte';
	import createAccountStore from '../stores/beatleader/account';
	import {BL_API_URL, CURRENT_URL} from '../network/queues/beatleader/api-queue';
	import ApprovalSong from '../components/Others/ApprovalSong.svelte';
	import beatSaverSvg from '../resources/beatsaver.svg';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import Spinner from '../components/Common/Spinner.svelte';

	const account = createAccountStore();

	let page = 0;
	let itemsPerPage = 5;
	let itemsPerPageValues = [5, 10, 15];
	let totalItems = 0;

	function updatePage() {
		if (totalItems <= itemsPerPage) {
			page = 0;
		}
	}

	function onPageChanged(event) {
		page = event.detail.page;
	}

	let songs;

	function fetchSongs() {
		fetch(BL_API_URL + 'maps/forapprove', {
			credentials: 'include',
		})
			.then(response => response.json())
			.then(data => {
				songs = data;
				totalItems = songs.length;
				updatePage(songs.length);
			});
	}

	$: currentMapperId = $account.player ? $account.player.playerInfo.mapperId : null;
	$: if (currentMapperId) fetchSongs();
</script>

<svelte:head>
	<title>Maps approval - BeatLeader</title>
</svelte:head>

<ContentBox>
	{#if songs}
		{#if songs.length}
			<div class="header">
				<h3>Hi! We borrowed some of your ranked maps.</h3>
				<span> We are sorry for not asking approval before and asking it rn. Select the maps you want to keep.<br /></span>
				<span><b>Everything else will be unranked on the 1st of October</b></span>
			</div>
			<div class={`song-score`} in:fly={{x: 300, delay: 30, duration: 500}} out:fade={{duration: 100}}>
				<div class="tab">
					{#each songs.slice(totalItems > itemsPerPage ? page * itemsPerPage : 0, (page + 1) * itemsPerPage < totalItems ? (page + 1) * itemsPerPage : totalItems) as song, songId}
						<ApprovalSong {song} listId={songId} {account} />
					{/each}
				</div>

				{#if songs && songs.length > itemsPerPage}
					<Pager bind:currentPage={page} bind:itemsPerPage {totalItems} {itemsPerPageValues} on:page-changed={onPageChanged} />
				{/if}
			</div>
		{:else}
			<div class="header">
				<h3>Hi! We didn't borrow your maps.</h3>
				<span>Send this link to someone who still not yet approved their maps.<br /></span>
				<a href="/leaderboards/1?mytype=mymaps">Or nominate some of your maps! Now we ask permission first XD</a>
			</div>
		{/if}
	{:else if currentMapperId}
		<h3>Loading</h3>
		<Spinner />
	{:else if $account.player}
		<div class="header">
			<h1>Link BeatSaver to check if we used your maps.</h1>
		</div>
		<div class="login">
			<form action={BL_API_URL + 'signin'} method="post">
				<input type="hidden" name="Provider" value="BeatSaver" />
				<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/approval'} />

				<Button icon={beatSaverSvg} label="Link to BeatSaver" type="submit" />
			</form>
		</div>
	{:else}
		<div class="header">
			<h1>Login with BeatSaver to check if we used your maps.</h1>
		</div>
		<div class="login">
			<form action={BL_API_URL + 'signin'} method="post">
				<input type="hidden" name="Provider" value="BeatSaver" />
				<input type="hidden" name="ReturnUrl" value={CURRENT_URL + '/approval'} />

				<Button icon={beatSaverSvg} label="Login with BeatSaver" type="submit" />
			</form>
		</div>
	{/if}
</ContentBox>

<style>
	.song-score {
		border-bottom: 1px solid var(--dimmed);
		padding: 0.5em 0;
	}

	.playlistInfo {
		display: flex;
	}

	.playlistTitle {
		display: block;
		max-width: 80%;
		max-height: 3em;
		overflow: auto;
	}

	.titleAndButtons {
		display: flex;
		justify-content: space-between;
		font-size: 1.1em;
		font-weight: 500;
		width: 90%;
		margin: 1em;
	}

	:global(.editTitleButton) {
		padding-bottom: 1.4em !important;
		padding-left: 0.6em !important;
	}

	.imageInput {
		cursor: pointer;
		display: flex;
		position: relative;
	}

	.playlistImage {
		width: 10em;
		height: fit-content;
		aspect-ratio: 1 / 1;
		min-width: 6em;
	}

	.imageChange {
		transition: opacity 0.2s ease-in-out;
		background-color: rgba(32, 33, 36, 0.6);
		bottom: 0;
		height: 33%;
		left: 0;
		opacity: 0;
		position: absolute;
		right: 0;
		display: flex;
		justify-content: center;
	}

	.changeLabel {
		top: 30%;
		position: absolute;
	}

	.oneclick-title {
		font-size: 0.8em;
		color: blueviolet;
	}

	.header {
		display: flex;
		flex-direction: column;
		justify-content: left;
		align-items: center;
	}

	h1 {
		font-size: 150%;
	}

	h3 {
		font-size: 200%;
	}

	.login {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100%;
	}
</style>
