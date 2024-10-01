<script>
	import MapTypeDescription from './MapTypeDescription.svelte';
	import MapTriangle from '../Common/MapTriangle.svelte';
	import {createEventDispatcher, getContext} from 'svelte';
	import {fade} from 'svelte/transition';

	import Value from '../Common/Value.svelte';
	import Badge from '../Common/Badge.svelte';
	import Icons from '../Song/Icons.svelte';
	import {formatDiffStatus, DifficultyStatus, wrapBLStatus} from '../../utils/beatleader/format';
	import {dateFromUnix, formatDate, formatDateRelative} from '../../utils/date';
	import MapRequirementDescription from './MapRequirementDescription.svelte';
	import LeaderboardStats from './LeaderboardStats.svelte';
	import {configStore} from '../../stores/config';
	import SongStatus from './SongStatus.svelte';
	import HashDisplay from '../Common/HashDisplay.svelte';
	import LeaderboardDisplayCaptureCorner from './LeaderboardDisplayCaptureCorner.svelte';
	import MapperList from './MapperList.svelte';
	import MapTriangleSmall from './MapTriangleSmall.svelte';
	import TriangleMobilePopup from './TriangleMobilePopup.svelte';
	import {BS_CDN} from '../../network/queues/beatleader/page-queue';

	export let leaderboard;
	export let leaderboardStore;
	export let ratings = null;

	export let currentLeaderboardId;
	export let batleRoyale = true;
	export let battleRoyaleDraft;

	const dispatch = createEventDispatcher();
	const {open, close} = getContext('simple-modal');

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

	function showTrianglePopup(leaderboard) {
		open(TriangleMobilePopup, {
			leaderboard,
			ratings,
		});
	}

	$: leaderboardGroup = leaderboard?.leaderboardGroup;
	$: song = leaderboard?.song;
	$: hash = song?.hash;
	$: coverUrl = song?.fullImageUrl ?? song?.imageUrl ?? (hash ? `${BS_CDN}/${encodeURIComponent(hash.toLowerCase())}.jpg` : null);
	$: leaderboardCaptor = leaderboard?.topClan;

	$: drawCinematics(cinematicsCanvas, coverUrl);

	$: name = song?.name;
	$: diffInfo = leaderboard?.diffInfo;
</script>

{#if leaderboard}
	<header class="header" transition:fade|global>
		<div class="cinematics">
			<div class="cinematics-canvas">
				<canvas bind:this={cinematicsCanvas} style="position: absolute; width: 100%; height: 100%; opacity: 0" />
			</div>
		</div>
		<div
			class="map-cover"
			style={coverUrl
				? `background: url(${coverUrl}); background-repeat: no-repeat; background-size: cover; background-position: center;`
				: ''}>
		</div>

		<div class="main-container">
			<div class="header-container">
				<div class="header-top-part">
					<h1 class="title is-4">
						<span class="name {name.length > 40 ? 'name-long' : 'name-short'}" title="Song name">{name} </span>
						{#if $configStore?.leaderboardPreferences?.showSubtitleInHeader && song.subName}
							<span class="subname">{song.subName}</span>
						{/if}
					</h1>

					<div class="title-container">
						<span class="author" title="Song author name">{song.authorName}</span>
						<MapperList {song} />
						<div class="status-and-type">
							{#if leaderboard.categoryDisplayName}
								<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)" fluid={true}>
									<span slot="label">
										{leaderboard.categoryDisplayName}
										{#if leaderboard.complexity}<Value value={leaderboard.complexity} digits={2} zero="" suffix="★" />{/if}
									</span>
								</Badge>
							{/if}
						</div>

						{#if $configStore?.leaderboardPreferences?.showStatsInHeader}
							<LeaderboardStats {leaderboard} />
						{/if}
						{#if $configStore?.leaderboardPreferences?.showHashInHeader}
							<HashDisplay {song} />
						{/if}
					</div>
				</div>
				{#if song.externalStatuses}
					<div class="song-statuses">
						{#if leaderboard.stats && leaderboard.stats.status != DifficultyStatus.unranked}
							<SongStatus songStatus={wrapBLStatus(leaderboard.stats.status)} />
						{/if}
						{#each leaderboard.song.externalStatuses as songStatus}
							<SongStatus {songStatus} />
						{/each}
					</div>
				{/if}
				<div class="header-bottom-part desktop-only">
					<div class="icons-container">
						<Icons {song} {diffInfo} mapCheck={true} {batleRoyale} bind:battleRoyaleDraft />
					</div>
				</div>
			</div>
			<div class="title-and-buttons desktop-only">
				<div class="header-top-part">
					<h2 class="title is-6" style="display: contents;">
						{#if leaderboard.stats && leaderboard.stats.passRating}
							<MapTriangle width="8em" height="8em" mapRating={ratings ?? leaderboard.stats} showRatings={true} />
						{/if}
					</h2>
					{#if leaderboard?.stats?.requirements || leaderboard?.stats?.type}
						<div class="requirements">
							{#if leaderboard?.stats?.type}
								<MapTypeDescription type={leaderboard?.stats.type} />
							{/if}
							{#if leaderboard?.stats?.requirements}
								<MapRequirementDescription type={leaderboard?.stats.requirements} />
							{/if}
						</div>
					{/if}
				</div>
				<div class="header-bottom-part">
					{#if leaderboardGroup && leaderboardGroup.length > 1}
						<div class="version-selector-container">
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
						</div>
					{/if}
				</div>
			</div>
		</div>

		{#if leaderboard.stats && leaderboard.stats.passRating}
			<div class="mobile-triangle mobile-only" on:click|preventDefault|stopPropagation={() => showTrianglePopup(leaderboard)}>
				<MapTriangleSmall leaderboard={leaderboard.difficultyBl} />
			</div>
		{/if}

		<div class="buttons-container desktop-only"></div>

		{#if $configStore?.leaderboardPreferences?.showClanCaptureInHeader && isRanked}
			<div class="capture-status">
				<LeaderboardDisplayCaptureCorner
					leaderboardId={leaderboard?.leaderboardId}
					clan={leaderboardCaptor}
					clanRankingContested={leaderboard?.clanRankingContested} />
			</div>
		{/if}
	</header>

	<div class="buttons-container mobile-only">
		<div class="icons-container">
			<Icons {song} {diffInfo} mapCheck={true} {batleRoyale} bind:battleRoyaleDraft />
		</div>
		{#if leaderboardGroup && leaderboardGroup.length > 1}
			<div class="version-selector-container">
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
			</div>
		{/if}
	</div>
{/if}

<style>
	header {
		position: relative;
		padding: 0.6em;
		border-radius: 0.4em;
		color: var(--alternate);
		display: flex;
		align-items: flex-start;
		justify-content: start !important;
		gap: 1em;
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

	.main-container {
		display: flex;
		justify-content: space-between;
		flex: 1;
		min-height: 16em;
	}

	.buttons-container {
		position: absolute;
		bottom: 0;
		height: 2.7em;
		margin-left: -0.6em;
		width: 100%;
		display: flex;
		justify-content: space-between;
		background-color: #0000004f;
		padding: 0.6em;
		border-radius: 0 0 12px 12px;
	}

	.icons-container {
		transform: scale(1.15);
		width: fit-content;
		margin-left: 0.8em;
		margin-bottom: 0.1em;
	}

	.version-selector-container {
		transform: scale(1.15);
		margin-bottom: -0.5em;
	}

	header .title {
		color: inherit !important;
		margin-left: -0.15em;
		margin-bottom: 0;
	}

	header h1 {
		margin-bottom: 0.2em;
	}

	header h1 span.name {
		color: #ffffffcc !important;
	}

	.map-cover {
		width: 16em;
		aspect-ratio: 1;
		border-radius: 8px;
		z-index: 1;
	}

	.name-long {
		font-size: 1.2em;
	}

	.name-short {
		font-size: 1.8em;
	}

	.subname {
		color: #ffffff93;
		font-size: 0.8em;
	}

	.author {
		color: #ffffffa3;
		font-size: 1.2em;
	}

	.diff-status {
		color: white;
	}

	.capture-status {
		position: absolute;
		top: 0;
		left: 0;
		height: 6em;
		overflow: hidden;
		z-index: 2;
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
		gap: 1em;
	}

	.header-top-part {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		flex: 1;
		z-index: 1;
	}

	.header-bottom-part {
		z-index: 1;
	}

	.title-container {
		display: flex;
		justify-content: center;
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
		text-align-last: center;
		white-space: nowrap;
		border: 0;
		border-radius: 6px;
		cursor: pointer;
		color: #363636;
		background-color: #dbdbdb;
		box-shadow: none;
		opacity: 0.35;
		font-family: inherit;
		font-size: 0.875rem;
		font-weight: 500;
		width: 100%;
		margin-bottom: -0.6em;
	}

	.group-option {
		color: black;
		font-family: inherit;
	}

	.requirements {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 0.2em;
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
		align-self: stretch;
		justify-content: center;
		flex-wrap: wrap;
		flex-direction: column;
		padding: 0.5em;
		min-width: fit-content;
	}

	.mobile-triangle {
		position: absolute;
		left: 8em;
		top: 8.4em;
		z-index: 2;
	}

	.mobile-only {
		display: none;
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
			padding: 0.4em 0.4em 0.15em 0.4em;
			gap: 0.5em;
		}

		.desktop-only {
			display: none;
		}

		.mobile-only {
			display: flex;
		}

		.buttons-container {
			position: relative;
			margin-left: 0;
			border-radius: 0;
			justify-content: flex-start;
			gap: 0.6em;
			height: unset;
		}

		.cinematics-canvas {
			transform: scaleY(1.2) translateZ(0);
		}

		.icons-container {
			margin-left: unset;
		}

		:global(.player .clan-badges) {
			display: none;
		}

		.header-container {
			min-height: 11.2em;
			gap: 0.3em;
		}

		.main-container {
			min-height: unset;
		}

		header .title {
			margin-left: unset;
		}

		.header {
			border-radius: 0;
			margin-bottom: 0;
		}

		.name-long {
			font-size: 1em;
		}

		.song-statuses {
			flex-wrap: wrap;
		}

		.name-short {
			font-size: 1.2em;
		}

		.author {
			font-size: 1em;
		}

		.map-cover {
			width: 11em;
		}

		.icons-container {
			transform: scale(1);
		}

		.version-selector-container {
			transform: scale(1);
		}

		:global(.leaderboard-header-box) {
			margin: 0.6em 0 0 !important;
			border-radius: 0 !important;
		}
	}
</style>
