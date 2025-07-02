<script>
	import {fade, fly, slide} from 'svelte/transition';
	import {navigate} from 'svelte-routing';
	import createPinnedScoresStore from '../../stores/beatleader/pinned-scores';
	import createAccountStore from '../../stores/beatleader/account';
	import {configStore} from '../../stores/config';
	import SongInfo from './SongInfo.svelte';
	import ScoreRank from '../Player/ScoreRank.svelte';
	import FormattedDate from '../Common/FormattedDate.svelte';
	import SongScoreDetails from '../Player/SongScoreDetails.svelte';
	import Icons from '../Song/Icons.svelte';
	import PlayerPerformance from '../Player/PlayerPerformance.svelte';
	import PlayerName from './PlayerName.svelte';
	import {colorForEndType, titleForEndType} from '../../utils/attempts';

	export let playerId = null;
	export let songScore = null;
	export let fixedBrowserTitle = null;
	export let idx = 0;
	export let service = null;
	export let withPlayers = false;
	export let noIcons = false;
	export let icons = null;
	export let showSong = true;
	export let inList = true;
	export let additionalStat = null;
	export let replayCounter = true;
	export let animationSign = 1;
	export let selectedMetric = null;

	let showDetails = false;

	const account = createAccountStore();
	const pinnedScoresStore = createPinnedScoresStore();

	function onScorePinned(e) {
		if (!e?.detail || songScore?.score?.id !== e.detail?.scoreId) return;

		if (songScore?.score) songScore.score.metadata = e?.detail?.metadata ?? {};

		$pinnedScoresStore[playerId] = [
			...new Set(
				[songScore].concat(
					$pinnedScoresStore[playerId]?.map((s, idx) => {
						if (Number.isFinite(s?.score?.metadata?.priority)) s.score.metadata.priority = idx + 2;

						return s;
					})
				)
			),
		];
	}

	function navigateToPlayer(playerId) {
		if (!playerId) return;

		navigate(`/u/${playerId}`);
	}

	function visibleScoreIcons(config) {
		var result = [];

		Object.keys(config).forEach(key => {
			if (config[key]) {
				result.push(key);
			}
		});

		return result;
	}

	function maybe(node, options) {
		if (animationSign) {
			return options.fn(node, options);
		} else {
			return options.fn(node, {duration: 0, delay: 0, easing: () => 0});
		}
	}

	function timeToLabel(time, prefix) {
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return prefix + ' ' + minutes + ':' + seconds.toString().padStart(2, '0');
	}

	let showAnyDetails = true;

	function checkShowAnyDetails(detailsPreferences) {
		if (!detailsPreferences) return;

		showAnyDetails = false;
		Object.keys(detailsPreferences).forEach(key => {
			if (detailsPreferences[key] === true) {
				showAnyDetails = true;
				return;
			}
		});
	}

	$: leaderboard = songScore?.leaderboard;
	$: score = songScore?.score;
	$: prevScore = score?.scoreImprovement?.timeset?.length && score?.scoreImprovement?.score ? score.scoreImprovement : null;
	$: song = leaderboard?.song;
	$: twitchUrl = songScore?.twitchVideo?.url;
	$: diffInfo = leaderboard?.diffInfo;
	$: modifiers = leaderboard?.difficultyBl?.modifierValues ?? null;

	$: isPlayerScore = $account?.id && $account?.id === score?.playerId;
	$: serviceIcon = score?.metadata ?? null;
	$: selectedIcons = icons ?? ($configStore && visibleScoreIcons($configStore.visibleScoreIcons));

	$: scoreBadgesHaveImprovements = [...(Object.values($configStore?.scoreBadges) ?? [])].some(row =>
		row.some(col => !!col?.withImprovements || col?.secondary === 'improvement')
	);
	$: checkShowAnyDetails($configStore?.scoreDetailsPreferences);
</script>

{#if songScore}
	<div
		class={`song-score row-${idx} scores-list-score ${score.status != 0 ? 'with-status' : ''}`}
		in:maybe|global={{fn: fly, x: animationSign * 300, delay: idx * 30, duration: 300}}
		out:maybe|global={{fn: fade, duration: 100}}
		class:with-details={showDetails}>
		{#if withPlayers}
			<div class="top-container">
				<div class="player">
					<PlayerName player={songScore.player} on:click={() => navigateToPlayer(songScore.player.alias ?? songScore.player.playerId)} />
				</div>
				{#if score.status != 0}
					{#if (score.status & 2) == 2}
						<div class="score-of-the-week">
							<span>Score Of The Week</span>
						</div>
					{/if}
				{/if}
			</div>
		{/if}
		{#if service == 'attempts'}
			<header>
				<h3 class="pin-description" title="Attempt number on this map">
					Attempt #{score.attemptsCount}
				</h3>
				{#if score.endType}
					<h3
						class="pin-description"
						title="Attempt end type"
						style={score.endType ? `background-color: ${colorForEndType(score.endType, 0.2)}` : ''}>
						{titleForEndType(score.endType)}
					</h3>
				{/if}
				{#if score.endType > 1}
					{#if score.startTime}
						<h3 class="pin-description" title="Attempt start time">
							{timeToLabel(score.startTime, 'from')}
						</h3>
					{/if}
					<h3 class="pin-description" title="Attempt finish time">
						{timeToLabel(score.time, 'at')}
					</h3>
				{/if}
			</header>
		{/if}
		<div class="main" class:beat-savior={service === 'beatsavior'} class:accsaber={service === 'accsaber'}>
			<a class="background-link" href="/score/{score.id}" on:click|preventDefault|stopPropagation={() => navigate(`/score/${score.id}`)}
			></a>
			<span class="rank tablet-and-up">
				{#if service !== 'beatsavior' && service !== 'attempts'}
					<ScoreRank
						rank={score.rank}
						countryRank={score.ssplCountryRank}
						countryRankTotal={null}
						hmd={score.hmd}
						controller={score.controller}
						platform={score.platform} />
				{/if}

				<div class="timeset">
					<FormattedDate
						date={score.timeSet}
						prevPrefix="vs "
						prevDate={scoreBadgesHaveImprovements ? (prevScore?.timeSet ?? null) : null} />
				</div>
			</span>

			<span class="song">
				<div>
					{#if showSong}
						<SongInfo
							{leaderboard}
							{score}
							rank={score.rank}
							{song}
							{twitchUrl}
							notClickable={['beatsavior'].includes(service)}
							{noIcons}
							category={leaderboard?.categoryDisplayName ?? null}
							{service}
							{playerId}
							icons={selectedIcons}
							replayLink={score.id ? null : score.replay}
							on:score-pinned={onScorePinned} />
					{/if}
				</div>
			</span>

			{#if !noIcons}
				<div class="up-to-tablet icons">
					<Icons
						layoutType="large"
						{song}
						{twitchUrl}
						{diffInfo}
						scoreId={score.id}
						replayLink={score.id ? null : score.replay}
						icons={selectedIcons}
						{serviceIcon}
						noPin={!isPlayerScore}
						on:score-pinned={onScorePinned} />
				</div>
				<div class="mobile-only icons">
					<Icons
						layoutType="flat"
						{song}
						{twitchUrl}
						{diffInfo}
						scoreId={score.id}
						replayLink={score.id ? null : score.replay}
						icons={selectedIcons}
						{serviceIcon}
						noPin={!isPlayerScore}
						on:score-pinned={onScorePinned} />
				</div>
			{/if}
			<span class="rank mobile-only">
				{#if service !== 'beatsavior'}
					<ScoreRank
						rank={score.rank}
						countryRank={score.ssplCountryRank}
						countryRankTotal={null}
						hmd={score.hmd}
						controller={score.controller}
						platform={score.platform} />
				{/if}
			</span>

			<span class="timeset mobile-only">
				<FormattedDate date={score.timeSet} prevPrefix="vs " prevDate={scoreBadgesHaveImprovements ? (prevScore?.timeSet ?? null) : null} />
			</span>

			{#if showAnyDetails}
				<div class="score-options-section tablet-and-up">
					<span
						class="beat-savior-reveal clickable"
						class:opened={showDetails}
						on:click={() => (showDetails = !showDetails)}
						title="Show details">
						<i class="fas fa-chevron-down" />
					</span>
				</div>
			{/if}

			<PlayerPerformance {service} {songScore} {showDetails} {modifiers} {additionalStat} {selectedMetric} on:badge-click />
			{#if showAnyDetails}
				<div class="score-options-section mobile-only">
					<span
						class="beat-savior-reveal clickable"
						class:opened={showDetails}
						on:click={() => (showDetails = !showDetails)}
						title="Show details">
						<i class="fas fa-chevron-down" />
					</span>
				</div>
			{/if}
		</div>

		{#if showDetails}
			<SongScoreDetails
				{playerId}
				{songScore}
				{fixedBrowserTitle}
				noSsLeaderboard={['beatsavior', 'accsaber'].includes(service)}
				showAccSaberLeaderboard={'accsaber' === service} />
		{/if}
	</div>
{/if}

<style>
	.main {
		padding: 0.5em;
		background-color: #222;
		border-radius: 0 8px 8px 8px;
		box-shadow: 0 4px 8px rgb(0 0 0 / 55%) !important;
		position: relative;
	}

	.main:hover {
		box-shadow: 0 4px 8px rgb(0 0 0 / 85%) !important;
	}

	.with-status .main {
		border-radius: 0 0 8px 8px;
	}

	.song-score .up-to-tablet + .main {
		padding-top: 0;
	}

	.song-score {
		color: white;
	}

	.song-score .main {
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		justify-content: center;
		grid-column-gap: 0.4em;
	}

	.song-score.with-details .main {
		border-bottom: none;
	}

	.song-score .main > *:last-child {
		margin-right: 0;
	}

	.song-score .main :global(.badge) {
		margin: 0 !important;
		padding: 0.125em 0.25em !important;
		width: 100%;
	}

	.song-score .main :global(.badge small) {
		font-size: 0.7em;
		font-weight: normal;
		margin-top: -2px;
	}

	.song-score .main :global(.inc),
	.song-score :global(.dec) {
		color: inherit;
	}

	.background-link {
		position: absolute;
		width: 100%;
		height: 100%;
		left: 0;
		top: 0;
		z-index: 0;
	}

	.rank {
		width: 5.5em;
		text-align: center;
	}

	.song {
		flex-grow: 1;
		min-width: 15.25em;
		z-index: 1;
	}

	.song > div {
		display: flex;
		flex-direction: column;
	}

	.timeset {
		width: 8.5em;
		text-align: center;
	}

	.timeset.mobile-only {
		align-items: baseline;
		gap: 0.5em;
		min-width: fit-content;
	}

	.top-container {
		display: flex;
		justify-content: space-between;
	}

	.player {
		text-align: left;
		margin-top: 0.6em;
		background: #332c36;
		width: fit-content;
		padding: 0.3em;
		border-radius: 8px 8px 0 0;
	}

	.score-of-the-week {
		text-align: left;
		margin-top: 0.6em;
		background: #490e63;
		width: fit-content;
		padding: 0.3em;
		border-radius: 8px 8px 0 0;
		padding-left: 0.5em;
		padding-right: 0.5em;
	}

	.main.beat-savior .timeset {
		width: auto;
	}

	.timeset :global(small) {
		line-height: 1;
	}

	.rank .timeset {
		width: auto;
		min-width: 7em;
		font-size: 0.8em;
	}

	.with-badge :global(.badge) {
		height: 100%;
	}

	small {
		display: block;
		text-align: center;
		white-space: nowrap;
		font-size: 0.75em;
	}

	.score-options-section {
		display: grid;
		justify-items: center;
		margin: 0.3em;
		z-index: 1;
	}

	.beat-savior-reveal {
		align-self: end;
		cursor: pointer;
		transition: transform 500ms;
		transform-origin: 0.42em 0.8em;
	}

	.beat-savior-reveal.opened {
		transform: rotateZ(180deg);
	}

	.end-type {
		border-radius: 6px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 0.4em 0 0.4em 0;
	}

	.attempts-count {
		font-size: 0.6em;
	}

	header {
		display: flex;
		align-items: center;
		grid-gap: 0;
		font-size: 0.875em;
		margin-top: -0.6em;
		margin-bottom: 0.5em;
	}

	header > h3 {
		width: fit-content;
		border-bottom-left-radius: 0.5em;
		border-bottom-right-radius: 0.5em;
		background: var(--row-separator);
		padding: 0 1em 0.2em;
	}

	h3 {
		width: fit-content;
		border-bottom-left-radius: 0.5em;
		border-bottom-right-radius: 0.5em;
		background: var(--row-separator);
		padding: 0 1em 0;
		margin-right: 0.5em;
	}

	h3.editable {
		cursor: pointer;
	}

	h3 .move i {
		padding: 0.25em 0.125em;
		cursor: pointer !important;
	}

	h3 i.fa-edit {
		display: inline-block;
		margin-left: 0.5em;
		cursor: pointer !important;
	}

	.icons h3 {
		border-radius: 5px;
	}

	.score-options-section.mobile-only {
		display: none !important;
	}
	.mobile-only.icons {
		display: none;
	}

	:global(.scores-list-score .details) {
		background-color: #171717;
		box-shadow: 0 2px 4px rgb(0 0 0 / 55%) !important;
	}

	@media screen and (max-width: 1023px) {
		.song-score .main {
			flex-wrap: wrap;
		}
		.song {
			min-width: 25.25em;
		}
		.up-to-tablet.icons {
			display: flex;
		}
	}

	@media screen and (max-width: 767px) {
		.song-score {
			padding: 0.75em 0;
		}
		.song {
			min-width: 15.25em;
		}

		.song-score .main {
			flex-wrap: wrap;
		}

		.rank,
		.timeset {
			padding-bottom: 0 !important;
		}

		.song {
			display: flex;
			justify-content: flex-start;
			align-items: center;
			width: 100%;
			margin-right: 0;
			padding-top: 1em;
			padding-bottom: 0.75em;
		}

		.up-to-tablet.icons {
			display: none;
		}

		.mobile-only.icons {
			display: flex;
			justify-content: center;
			width: 100%;
			margin-top: -0.6em;
			margin-bottom: 0.4em;
		}

		.player {
			text-align: center;
		}
		.score-options-section.mobile-only {
			display: grid !important;
		}
	}
</style>
