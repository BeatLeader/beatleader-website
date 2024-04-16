<script>
	import MapTypeDescription from './MapTypeDescription.svelte';
	import MapTriangle from '../Common/MapTriangle.svelte';
	import {opt} from '../../utils/js';
	import {createEventDispatcher} from 'svelte';
	import {fade} from 'svelte/transition';

	import Value from '../Common/Value.svelte';
	import Badge from '../Common/Badge.svelte';
	import Icons from '../Song/Icons.svelte';
	import {formatDiffStatus, DifficultyStatus} from '../../utils/beatleader/format';
	import {dateFromUnix, formatDate, formatDateRelative} from '../../utils/date';
	import MapRequirementDescription from './MapRequirementDescription.svelte';
	import LeaderboardDisplayCaptureStatus from './LeaderboardDisplayCaptureStatus.svelte';
	import LeaderboardStats from './LeaderboardStats.svelte';
	import {configStore} from '../../stores/config';
	import Spinner from '../Common/Spinner.svelte';
	import SongStatus from './SongStatus.svelte';
	import HashDisplay from '../Common/HashDisplay.svelte';

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

	$: isRanked = leaderboard?.stats?.status === DifficultyStatus.ranked;
	let cinematicsCanvas;

	function drawCinematics(cinematicsCanvas, coverUrl) {
		if (coverUrl && cinematicsCanvas) {
			cinematicsCanvas.style.opacity = 1;
			const context = cinematicsCanvas.getContext('2d');

			const cover = new Image();
			cover.onload = function () {
				context.drawImage(cover, 0, 0, cinematicsCanvas.width, cinematicsCanvas.height);
			};
			cover.src = coverUrl;
		}
	}

	$: leaderboardGroup = leaderboard?.leaderboardGroup;
	$: song = leaderboard?.song;
	$: coverUrl = song?.fullImageUrl ?? song?.imageUrl ?? leaderboard?.beatMaps?.versions[0].coverURL;
	$: leaderboardCaptor = leaderboard?.topClan;

	$: drawCinematics(cinematicsCanvas, coverUrl);

	$: hash = song?.hash;
	$: name = song?.name;
	$: diffInfo = leaderboard?.diffInfo;
</script>

{#if leaderboard}
	<header
		class="header"
		style={coverUrl
			? `background: linear-gradient(#303030a2, #303030a2), url(${coverUrl}); background-repeat: no-repeat; background-size: cover; background-position: center;`
			: ''}
		transition:fade|global>
		<div class="cinematics">
			<div class="cinematics-canvas">
				<canvas bind:this={cinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0" />
			</div>
		</div>

		<div class="header-container">
			<h1 class="title is-4">
				<span class="name {name.length > 40 ? 'name-long' : 'name-short'}" title="Song name">{name} </span>
				{#if $configStore?.leaderboardPreferences?.showSubtitleInHeader && song.subName}
					<span class="subname">{song.subName}</span>
				{/if}
			</h1>

			<div class="title-container">
				<span class="author" title="Song author name">{song.authorName}</span>
				<small class="level-author" title="Mapper">Mapped by: {song.levelAuthorName}</small>
				<div class="status-and-type">
					{#if leaderboard.categoryDisplayName}
						<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)" fluid={true}>
							<span slot="label">
								{leaderboard.categoryDisplayName}
								{#if leaderboard.complexity}<Value value={leaderboard.complexity} digits={2} zero="" suffix="★" />{/if}
							</span>
						</Badge>
					{/if}

					{#if leaderboard.stats}<span class="diff-status">{formatDiffStatus(leaderboard.stats.status)}</span>{/if}
					{#if leaderboard?.stats?.type}
						<MapTypeDescription type={leaderboard?.stats.type} />
					{/if}
				</div>
				{#if $configStore?.leaderboardPreferences?.showClanCaptureInHeader && isRanked}
					<LeaderboardDisplayCaptureStatus
						leaderboardId={leaderboard?.leaderboardId}
						clan={leaderboardCaptor}
						clanRankingContested={leaderboard?.clanRankingContested} />
				{/if}
				{#if song.externalStatuses}
					<div class="song-statuses">
						{#each leaderboard.song.externalStatuses as songStatus}
							<SongStatus {songStatus} />
						{/each}
					</div>
				{/if}
				{#if $configStore?.leaderboardPreferences?.showStatsInHeader}
					<LeaderboardStats {leaderboard} />
				{/if}
				{#if $configStore?.leaderboardPreferences?.showHashInHeader}
					<HashDisplay {song} />
				{/if}
			</div>

			<Icons {hash} {diffInfo} mapCheck={true} {batleRoyale} bind:battleRoyaleDraft />
		</div>

		<div class="title-and-buttons">
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
						<option class="group-option" value={option.id} title={formatDate(dateFromUnix(option.timestamp))}>
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
		padding: 0.6em;
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
		margin-left: -0.15em;
	}

	header h1 {
		margin-bottom: 0.2em;
	}

	header h1 span.name {
		color: #ffffffab !important;
	}

	.name-long {
		font-size: 1.5em;
	}

	.name-short {
		font-size: 2.5em;
	}

	.subname {
		color: #ffffff93;
		font-size: 1em;
	}

	.author {
		color: #ffffffa3;
	}

	.level-author {
		color: var(--alternate);
	}

	.diff-status {
		color: white;
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
		min-height: 14em;
	}

	.title-container {
		display: flex;
		justify-content: space-between;
		flex-direction: column;
		grid-gap: 0.2em;
	}

	.song-statuses {
		color: #ffffffab;
		display: flex;
		gap: 0.25em;
	}

	.cinematics {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		pointer-events: none;
	}

	.cinematics-canvas {
		filter: blur(5em) opacity(0.5) saturate(250%);
		left: 0;
		pointer-events: none;
		position: absolute;
		top: 0;
		transform: scale(1.1) translateZ(0);
		width: 100%;
		z-index: -1;
		height: 100%;
	}

	.status-and-type {
		display: flex;
		gap: 0.6em;
	}

	:global(.title-container .stats) {
		justify-content: start !important;
		color: #ffffffa3;
		max-width: 35em;
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
		width: 100%;
	}

	.group-option {
		color: black;
		font-family: inherit;
	}

	.requirements {
		display: flex;
		flex-wrap: wrap;
		row-gap: 0.5em;
		padding-top: 0.7em;
		padding-bottom: 0.7em;
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
		margin-top: 0.8em;
		align-self: stretch;
		justify-content: space-between;
		flex-wrap: wrap;
		flex-direction: column;
		min-width: fit-content;
	}

	:global(.voteButton) {
		margin-top: 0 !important;
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

		.title-container {
			text-align: center;
		}

		.header-container {
			align-items: center;
			min-height: 10em;
		}

		.status-and-type {
			justify-content: center;
		}
		:global(.title-container .stats) {
			justify-content: center !important;
		}

		.header {
			border-radius: 0;
			margin-bottom: 0;
		}

		:global(.leaderboard-header-box) {
			margin: 0 !important;
		}

		.song-statuses {
			justify-content: center;
		}
	}

	@media screen and (max-width: 520px) {
		.cinematics {
			display: none;
		}
		header {
			flex-direction: column;
		}
	}
</style>
