<script>
	import createLeaderboardsService from '../../services/beatleader/leaderboardsMap';
	import {navigate} from 'svelte-routing';
	import Button from '../Common/Button.svelte';
	import Difficulty from '../Song/Difficulty.svelte';
	import {slide} from 'svelte/transition';
	import Spinner from '../Common/Spinner.svelte';

	export let song;
	export let listId;
	export let store;
	export let canModify;
	export let idx;

	let leaderboardsService = createLeaderboardsService();

	let songInfo;
	let leaderboards;
	let showDiffIcons;
	let leaderboardUrl;
	let coverUrl;

	function decapitalizeFirstLetter(string) {
		return string.charAt(0).toLowerCase() + string.slice(1);
	}

	async function updateSongKey(mapHash) {
		songInfo = null;

		const songInfoValue = await leaderboardsService.byHash(mapHash);
		if (songInfoValue && songInfoValue.song.id && songInfoValue.song.hash == hash) {
			songInfo = songInfoValue.song;
			leaderboards = songInfoValue.leaderboards;
			coverUrl = songInfo.coverImage;

			showDiffIcons = leaderboards.some(el => el.difficulty.modeName != 'Standard');
			leaderboardUrl = `/leaderboard/global/${leaderboards[0].id}/1`;
		}
	}

	function toggleDifficulty(diff) {
		const index = difficulties
			? difficulties.findIndex(el => decapitalizeFirstLetter(diff.difficultyName) == el.name && diff.modeName == el.characteristic)
			: -1;
		if (index == -1) {
			if (difficulties) {
				difficulties.push({
					name: decapitalizeFirstLetter(diff.difficultyName),
					characteristic: diff.modeName,
				});
			} else {
				difficulties = [
					{
						name: decapitalizeFirstLetter(diff.difficultyName),
						characteristic: diff.modeName,
					},
				];
				song.difficulties = difficulties;
			}
		} else {
			difficulties.splice(index, 1);
		}

		difficulties = difficulties;
		store.set($store);
	}

	$: hash = song.hash;
	$: difficulties = song.difficulties;
	$: updateSongKey(hash);
</script>

<div class="container row-${idx}" transition:slide>
	{#if songInfo}
		<img class="cover" src={coverUrl} alt="" />
		<div style="display: grid; padding-left: 1em">
			<a href={leaderboardUrl} class="name" on:click|preventDefault={() => navigate(leaderboardUrl)}>{songInfo.name}</a>
			<div class="author">{songInfo.mapper}</div>
			<div style="display: inline;">
				{#each leaderboards as leaderboard, songId}
					<Difficulty
						diff={{type: leaderboard.difficulty.modeName, diff: leaderboard.difficulty.difficultyName, stars: leaderboard.difficulty.stars}}
						pointer={true}
						useShortName={true}
						reverseColors={true}
						stars={leaderboard.difficulty.stars}
						starsSuffix="★"
						{showDiffIcons}
						enabled={difficulties
							? difficulties.some(
									el =>
										el.name == decapitalizeFirstLetter(leaderboard.difficulty.difficultyName) &&
										el.characteristic == leaderboard.difficulty.modeName
							  )
							: true}
						on:click={() => toggleDifficulty(leaderboard.difficulty)} />
				{/each}
			</div>
		</div>
	{:else}
		<div class="cover">
			<Spinner />
		</div>
	{/if}
	{#if canModify}
		<Button
			cls="delistSong"
			iconFa="fas fa-list-ul"
			title="Remove from the {$store[listId]?.playlistTitle}"
			noMargin={true}
			type="danger"
			on:click={store.remove(hash, listId)} />
	{/if}
</div>

<style>
	.container {
		display: flex;
		margin: 1.5em;
		border-radius: 1em;
		padding: 0.8em;
		background-color: rgba(87, 87, 87, 0.582);
	}

	.cover {
		width: 6em;
		height: 6em;
		border-radius: 0.5em;
	}

	:global(.delistSong) {
		position: absolute !important;
		right: 0.8em;
		border-radius: 0.5em !important;
	}
</style>
