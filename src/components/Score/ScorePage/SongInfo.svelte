<script>
	import {navigate} from 'svelte-routing';
	import {
		diffColors,
		difficultyDescriptions,
		DifficultyStatus,
		getSongSortingValue,
		modeDescriptions,
		wrapBLStatus,
		sortingValueIsSongOnly,
		badgesDef,
		userDiffNameForDiff,
		starsToBackgroundColor,
		starsToColor,
	} from '../../../utils/beatleader/format';
	import createAccountStore from '../../../stores/beatleader/account';
	import {LEADERBOARD_SCORES_PER_PAGE} from '../../../utils/beatleader/consts';
	import {LEADERBOARD_SCORES_PER_PAGE as ACCSABER_LEADERBOARD_SCORES_PER_PAGE} from '../../../utils/accsaber/consts';
	import Icons from '../../Song/Icons.svelte';
	import Badge from '../../Common/Badge.svelte';
	import SongCover from '../../Player/SongCover.svelte';
	import {configStore} from '../../../stores/config';
	import SongStatus from '../../Maps/List/SongStatus.svelte';
	import {BS_CDN} from '../../../network/queues/beatleader/page-queue';

	export let leaderboard = null;
	export let score = null;
	export let rank = null;
	export let song = null;
	export let twitchUrl = null;
	export let notClickable = false;
	export let replayLink = false;
	export let category = null;
	export let service = 'scores';
	export let noIcons = false;
	export let icons = null;

	const account = createAccountStore();

	function mapServiceToLink(service) {
		switch (service) {
			case 'accsaber':
			case 'clanranking':
				return service;
		}

		return 'global';
	}

	$: song = leaderboard?.song ?? null;
	$: scoresPerPage = service === 'accsaber' ? ACCSABER_LEADERBOARD_SCORES_PER_PAGE : LEADERBOARD_SCORES_PER_PAGE;
	$: page = rank && Number.isFinite(rank) ? Math.floor((rank - 1) / scoresPerPage) + 1 : 1;
	$: diff = leaderboard?.difficultyBl;
	$: leaderboardId = leaderboard?.leaderboardId ?? '';
	$: leaderboardUrl = `/leaderboard/${mapServiceToLink(service)}/${leaderboardId}/${page ?? ''}`;
	$: isPlayerScore = $account?.id && $account?.id === score?.playerId;
	$: serviceIcon = score?.metadata ?? null;

	$: hash = song?.hash ?? null;
	$: coverUrl = song?.coverImage ?? (hash ? `${BS_CDN}/${encodeURIComponent(hash.toLowerCase())}.jpg` : '/assets/song-default.webp');

	$: console.log(diff);
</script>

{#if song}
	<section>
		<a class="songLink" href={leaderboardUrl} on:click|preventDefault={() => navigate(leaderboardUrl)}>
			<div class="cover-and-name">
				<img class="song-cover" src={coverUrl} />
				<div class="name-and-author">
					<span class="name">{song.name} {song.subName} by <span class="author-name">{song.author}</span></span>
					<div class="author">
						<span>mapped by</span><span class="mapper">{song.mapper}</span>
					</div>
				</div>
			</div>
			<div class="diff-container">
				<div
					class="diff-orb"
					style="background-color: {starsToBackgroundColor(diff, $configStore)}; color: {starsToColor(
						diff,
						$configStore
					)}; margin-right: 0;">
					<span class="diff-name">{userDiffNameForDiff(diff.value)}</span>
					{#if diff.stars}
						<div class="stars-container">
							<span>{diff.stars.toFixed(2)}</span><span>★</span>
						</div>
					{/if}
				</div>
				{#if diff.status && diff.status != DifficultyStatus.unranked && diff.status != DifficultyStatus.unrankable}
					<div class="tail-container">
						<div class="status-container">
							<SongStatus songStatus={wrapBLStatus(diff.status)} />
						</div>
					</div>
				{/if}
			</div>
		</a>
	</section>
{/if}

<style>
	section {
		display: flex;
		justify-content: flex-start;

		align-items: center;
		grid-gap: 0.75em;
		background-color: #0000003b;
		padding: 0.5em;
		border-radius: 12px 12px 0 0;
		margin-bottom: 0.6em;
	}

	.songLink {
		text-align: left;
		font-size: 1.2rem;
		font-weight: 500;
		flex-grow: 1;
		color: white;

		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
	}

	.song-cover {
		width: 3em;
		height: 3em;
		border-radius: 8px;
	}

	.songLink .name {
		overflow-wrap: anywhere;
	}

	.songLink .mapper {
		color: var(--ppColour);
	}

	.author {
		display: flex;
		gap: 0.5em;
		align-items: center;
	}

	.author-name {
		overflow-wrap: anywhere;
	}

	.name-and-author {
		display: flex;
		flex-direction: column;
	}

	.cover-and-name {
		display: flex;
		gap: 0.5em;
	}

	.category {
		font-size: 0.75em;
	}

	.songLink .category :global(.badge) {
		width: auto;
	}

	.diff-container {
		display: flex;
		position: relative;
		pointer-events: none;
		color: white;
		gap: 0.5em;
		font-size: 1.3em;
		justify-content: center;
		align-items: center;
	}

	.diff-container.isHovered {
		display: contents;
		align-items: center;
		pointer-events: auto;
	}
	.status-container {
		display: flex;
		gap: 0.3em;
		align-items: center;
	}

	.mode-icon {
		width: 1.2em;
		height: 1.2em;
		display: block;
	}

	.diff-orb {
		font-weight: 600;
		padding: 0.15em 0.3em 0.18em 0.4em;
		font-size: 0.7em;
		border-radius: 0.8em;
		display: flex;
		align-items: center;
		gap: 0.1em;
		min-height: 1.6em;
		position: relative;
		padding: 0.1em 0.3em 0.1em 0.4em;
		font-size: 0.8em;
		border-radius: 0.7em;
		justify-content: space-between;
		gap: 0.5em;
	}

	.diff-orb::before {
		content: '';
		position: absolute;
		top: -0.2em;
		bottom: -0.2em;
		right: -0.2em;
		border-radius: 10px 0 0 10px;
		left: -0.2em;
		z-index: -1;
	}

	.diff-container.isHovered:hover .diff-orb::before {
		background-color: #474747a1;
	}

	.tail-container {
		position: relative;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.2em;
		color: white;
		cursor: pointer;
	}

	.tail-container::before {
		content: '';
		position: absolute;
		top: -0.16em;
		bottom: -0.16em;
		right: -0.2em;
		border-radius: 0 10px 10px 0;
		left: -0.15em;
		z-index: -1;
	}

	@media screen and (max-width: 767px) {
		.songLink {
			row-gap: 0.5em;
			justify-content: center;
		}
	}
</style>
