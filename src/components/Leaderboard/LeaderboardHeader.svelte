<script>
	import MapTypeDescription from './MapTypeDescription.svelte';
	import MapTriangle from '../Common/MapTriangle.svelte';
	import {opt} from '../../utils/js';
	import {createEventDispatcher} from 'svelte';
	import {fade} from 'svelte/transition';

	import Value from '../Common/Value.svelte';
	import Badge from '../Common/Badge.svelte';
	import ClanBadges from '../Player/ClanBadges.svelte';
	import Icons from '../Song/Icons.svelte';
	import {formatDiffStatus, DifficultyStatus} from '../../utils/beatleader/format';
	import {dateFromUnix, formatDateRelative} from '../../utils/date';
	import MapRequirementDescription from './MapRequirementDescription.svelte';

	export let leaderboard;
	export let leaderboardStore;
	export let ratings = null;

	export let currentLeaderboardId;
	export let batleRoyale = true;
	export let battleRoyaleDraft;

	const dispatch = createEventDispatcher();

	function onSelectedGroupEntryChanged() {
		dispatch('group-changed');
	}

	$: clanRankingList = opt($leaderboardStore, 'clanRanking', null);
	$: isRanked = leaderboard?.stats?.status === DifficultyStatus.ranked;
	$: leaderboardGroup = leaderboard?.leaderboardGroup;
	$: song = leaderboard?.song;
	$: coverUrl = song?.fullImageUrl ?? song?.imageUrl ?? leaderboard?.beatMaps?.versions[0].coverURL;

	$: hash = song?.hash;
	$: diffInfo = leaderboard?.diffInfo;
</script>

{#if leaderboard}
	<header
		class="header"
		style={coverUrl
			? `background: linear-gradient(#303030a2, #303030a2), url(${coverUrl}); background-repeat: no-repeat; background-size: cover; background-position: center;`
			: ''}
		transition:fade>
		<div class="header-container">
			<div class="title-container">
				<h1 class="title is-4">
					<span class="name" title="Song name">{song.name} {song.subName ? song.subName : ''}</span>
				</h1>
				<span class="author" title="Song author name">{song.authorName}</span>
				<small class="level-author" title="Mapper">Mapped by: {song.levelAuthorName}</small>
			</div>

			<Icons {hash} {diffInfo} mapCheck={true} {batleRoyale} bind:battleRoyaleDraft />
		</div>


		<div class="title-and-buttons">
			<div class="status-and-type">
				{#if leaderboard.categoryDisplayName}
					<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)" fluid={true}>
						<span slot="label">
							{leaderboard.categoryDisplayName}
							{#if leaderboard.complexity}<Value value={leaderboard.complexity} digits={2} zero="" suffix="★" />{/if}
						</span>
					</Badge>
				{/if}

				{#if leaderboard.stats}<span>{formatDiffStatus(leaderboard.stats.status)}</span>{/if}
				{#if leaderboard?.stats?.type}
					<MapTypeDescription type={leaderboard?.stats.type} />
				{/if}
			</div>
			<div class="status-and-type">
				{#if leaderboard.stats}
					{#if leaderboard?.clanRankingContested}
						<div style=" --clan-color: {'#000000'}" class="captor-clan captor-clan-outline">
							<p class="captured-by">
								Captured by:
							</p>
							<ClanBadges clanInput={'CONTESTED'}/>
						</div>
					{:else if (clanRankingList?.[0]?.clan ?? null) === null}
						<div style=" --clan-color: {'#000000'}" class="captor-clan captor-clan-outline">
							<p class="captured-by">
								Captured by:
							</p>
							<ClanBadges clanInput={'UNCAPTURED'}/>
						</div>
					{:else}
						<div style=" --clan-color: {clanRankingList?.[0].clan?.color ?? '#000000'}" class="captor-clan captor-clan-outline">
							<p class="captured-by">
								Captured by:
							</p>
							<ClanBadges clanInput={clanRankingList[0].clan}/>
						</div>
					{/if}
				{/if}
			</div>
			<h2 class="title is-6" style="display: contents;">
				{#if leaderboard.stats && leaderboard.stats.passRating}
					<MapTriangle width="8em" height="8em" mapRating={ratings ?? leaderboard.stats} showRatings={true} />
				{/if}
			</h2>
			{#if leaderboard?.stats?.requirements}
				<div class="requirements">
					<MapRequirementDescription type={leaderboard?.stats.requirements} />
				</div>
			{/if}
			{#if leaderboardGroup && leaderboardGroup.length > 1}
				<select class="group-select" bind:value={currentLeaderboardId} on:change={onSelectedGroupEntryChanged}>
					{#each leaderboardGroup as option (option.id)}
						<option class="group-option" value={option.id}>
							{#if option.timestamp}
								{formatDateRelative(dateFromUnix(option.timestamp))} - {formatDiffStatus(option.status)}
							{:else}
								{formatDiffStatus(option.status)}
							{/if}
						</option>
					{/each}
				</select>
			{/if}
		</div>
	</header>
{/if}

<style>
	header {
		padding: 0.4em 0.6em;
		border-radius: 0.4em;
		color: var(--alternate);
		display: flex;
		align-items: center;
		justify-content: space-between !important;
		margin-bottom: 1.2em;
	}

	header:before {
		position: absolute;
		content: ' ';
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0.1;
		background-repeat: no-repeat;
		background-size: cover;
		pointer-events: none;
	}

	header .title {
		color: inherit !important;
	}

	header h1 {
		font-size: 1em !important;
		margin-bottom: 0.5em;
	}

	header h1 span.name {
		font-size: 1.8em;
	}

	header h2.title {
		font-size: 1em !important;
		color: var(--increase, #42b129) !important;
		margin-top: 0.5em;
		margin-bottom: 0.5em;
	}

	.header-container {
		display: flex;
		justify-content: space-between;
		flex-direction: column;
	}

	.title-container {
		display: flex;
		justify-content: space-between;
		flex-direction: column;
		grid-gap: 0.2em;
	}

	.status-and-type {
		display: flex;
		gap: 0.6em;
	}

	.captured-by {
		text-align: center;
	}

	.group-select {
		height: fit-content;
		padding: 0.175rem;
		text-align: center;
		white-space: nowrap;
		border: 0;
		border-radius: 0.2em;
		cursor: pointer;
		color: var(--color, #363636);
		background-color: #dbdbdb;
		box-shadow: none;
		opacity: 0.35;
		font-family: inherit;
		font-size: 0.875rem;
		font-weight: 500;
		margin: 0.4em;
	}

	.group-option {
		color: black;
		font-family: inherit;
	}

	.requirements {
		display: flex;
	}

	header small {
		font-size: 0.75em;
		color: var(--ppColour);
	}

	header .diff :global(.reversed) {
		display: inline-block;
		padding: 0.1em 0.25em 0.25em 0.25em;
		margin-left: 0.5em;
		margin-right: 0.5em;
		border-radius: 0.25em;
	}

	:global(.voter-feedback-button) {
		height: 1.8em;
	}

	:global(.battleroyalebtn) {
		margin-left: 1em;
		margin-bottom: 0.5em;
	}

	.title-and-buttons {
		display: flex;
		align-items: center;
		margin: 0.4em;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.5em;
		flex-direction: column;
		min-width: fit-content;
	}

	:global(.voteButton) {
		margin-top: 0.25em !important;
		height: 1.8em;
	}

	@media screen and (max-width: 1024px) {
		header {
			margin-inline: 0;
		}
	}

	@media screen and (max-width: 767px) {
		header {
			margin-inline: 0;
			max-width: 100vw;
		}

		:global(.player .clan-badges) {
			display: none;
		}
	}

	@media screen and (max-width: 520px) {
		header {
			flex-direction: column;
		}
	}
</style>
