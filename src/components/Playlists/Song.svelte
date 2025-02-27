<script>
	import createLeaderboardsService from '../../services/beatleader/leaderboardsMap';
	import {navigate} from 'svelte-routing';
	import Button from '../Common/Button.svelte';
	import Difficulty from '../Song/Difficulty.svelte';
	import {slide} from 'svelte/transition';
	import Spinner from '../Common/Spinner.svelte';
	import SongScoreCompact from '../Leaderboards/SongScoreCompact.svelte';
	import {processScore} from '../../network/clients/beatleader/scores/utils/processScore';
	import {getDiffNameColor} from '../../utils/beatleader/format';
	import {createEventDispatcher} from 'svelte';

	export let song;
	export let store;
	export let canModify;
	export let idx;
	export let localPlaylistId;

	let leaderboardsService = createLeaderboardsService();
	const dispatch = createEventDispatcher();

	let songInfo;
	let leaderboards;
	let showDiffIcons;
	let leaderboardUrl;
	let coverUrl;

	function decapitalizeFirstLetter(string) {
		return string.charAt(0).toLowerCase() + string.slice(1);
	}

	async function updateSongKey(mapHash, refresh) {
		songInfo = null;

		const mapResponse = await leaderboardsService.byHashWithScore(mapHash, refresh);
		const songInfoValue = mapResponse.info;
		if (songInfoValue && songInfoValue.song.id && songInfoValue.song.hash.toLowerCase() == hash.toLowerCase()) {
			songInfo = songInfoValue.song;
			leaderboards = songInfoValue.leaderboards.filter(
				l =>
					l.difficulty.mode <= 7 ||
					(difficulties?.length &&
						difficulties.find(
							el => l.difficulty.modeName == el.characteristic && decapitalizeFirstLetter(l.difficulty.difficultyName) == el.name
						))
			);
			coverUrl = songInfo.coverImage;

			let selectedLeaderboard = leaderboards[0];
			if (difficulties?.length) {
				selectedLeaderboard = leaderboards.find(
					el =>
						el.difficulty.modeName == difficulties[0].characteristic &&
						decapitalizeFirstLetter(el.difficulty.difficultyName) == difficulties[0].name
				);
			}

			showDiffIcons = leaderboards.some(el => el.difficulty.modeName != 'Standard');
			if (selectedLeaderboard) {
				leaderboardUrl = `/leaderboard/global/${selectedLeaderboard.id}/1`;
			}

			if (!refresh && mapResponse.cached) {
				updateSongKey(mapHash, true);
			}
		}
	}

	function toggleDifficulty(diff) {
		const index = difficulties
			? difficulties.findIndex(el => decapitalizeFirstLetter(diff.difficultyName) == el.name && diff.modeName == el.characteristic)
			: -1;
		const diffInfo = {
			diff: diff.difficultyName,
			type: diff.modeName,
		};
		if (index == -1) {
			store.addDiff(hash, diffInfo, localPlaylistId);
		} else {
			store.removeDiff(hash, diffInfo, localPlaylistId);
		}

		difficulties = difficulties;
	}

	$: hash = song.hash;
	$: difficulties = song.difficulties;
	$: updateSongKey(hash);
</script>

<div class="container row-${idx}">
	{#if songInfo}
		<div class="cover-container">
			<img loading="lazy" class="cover" src={coverUrl} alt="" />
			{#if canModify}
				<div class="button-container mobile-only">
					<Button
						cls="delistSong"
						iconFa="fas fa-arrow-up"
						title="Move up in the list"
						noMargin={true}
						on:click={() => dispatch('move-up')} />
					<Button
						cls="delistSong"
						iconFa="fas fa-arrow-down"
						title="Move down in the list"
						noMargin={true}
						on:click={() => dispatch('move-down')} />
					<Button
						cls="delistSong"
						iconFa="fas fa-list-ul"
						title="Remove from the {$store[localPlaylistId]?.playlistTitle}"
						noMargin={true}
						type="danger"
						on:click={store.remove(hash, localPlaylistId)} />
				</div>
			{/if}
		</div>
		<div class="song-container">
			<div class="row-container">
				<div class="name-container">
					<a href={leaderboardUrl} class="name" on:click|preventDefault={() => navigate(leaderboardUrl)}>{songInfo.name}</a>
					<div class="author">{songInfo.mapper}</div>
				</div>
				{#if canModify}
					<div class="button-container desktop-only">
						<Button
							cls="delistSong"
							iconFa="fas fa-arrow-up"
							title="Move up in the list"
							noMargin={true}
							on:click={() => dispatch('move-up')} />
						<Button
							cls="delistSong"
							iconFa="fas fa-arrow-down"
							title="Move down in the list"
							noMargin={true}
							on:click={() => dispatch('move-down')} />
						<Button
							cls="delistSong"
							iconFa="fas fa-list-ul"
							title="Remove from the {$store[localPlaylistId]?.playlistTitle}"
							noMargin={true}
							type="danger"
							on:click={store.remove(hash, localPlaylistId)} />
					</div>
				{/if}
			</div>
			<div class="difficulties">
				{#each leaderboards as leaderboard, songId}
					<div
						class={leaderboard.myScore ? 'difficulty-with-score' : 'difficulty-with-no-score'}
						style="--diff-color: {getDiffNameColor(leaderboard.difficulty.difficultyName)}">
						<Difficulty
							diff={{
								type: leaderboard.difficulty.modeName,
								diff: leaderboard.difficulty.difficultyName,
								stars: leaderboard.difficulty.stars,
							}}
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
								: false}
							on:click={() => toggleDifficulty(leaderboard.difficulty)} />
						{#if leaderboard.myScore}
							<SongScoreCompact
								playerId={leaderboard.myScore.player.id}
								songScore={processScore({leaderboard: leaderboard, ...leaderboard.myScore})}
								service={'scores'}
								shortdate={true} />
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="cover">
			<Spinner />
		</div>
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

	.difficulties {
		display: flex;
		gap: 0.3em;
		flex-wrap: wrap;
	}

	.song-container {
		display: flex;
		padding-left: 1em;
		flex-direction: column;
		flex: 1;
	}

	.cover {
		width: 6em;
		height: 6em;
		border-radius: 0.5em;
	}

	.row-container {
		display: flex;
		justify-content: space-between;
		flex: 1;
	}

	.difficulty-with-score {
		display: flex;
		flex-direction: column;
		border: solid var(--diff-color);
	}

	.difficulty-with-no-score {
		display: contents;
	}

	.mobile-only {
		display: none;
	}

	:global(.delistSong) {
		border-radius: 0.5em !important;
	}

	:global(.difficulties .diff) {
		padding-right: 0.2em;
		padding-left: 0.3em;
	}

	@media (max-width: 768px) {
		.mobile-only {
			display: flex;
			gap: 0.2em;
		}

		.desktop-only {
			display: none;
		}
	}
</style>
