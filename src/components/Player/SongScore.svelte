<script>
	import {fade, fly, slide} from 'svelte/transition';
	import createPinnedScoresStore from '../../stores/beatleader/pinned-scores';
	import createAccountStore from '../../stores/beatleader/account';
	import {opt} from '../../utils/js';
	import SongInfo from './SongInfo.svelte';
	import ScoreRank from './ScoreRank.svelte';
	import FormattedDate from '../Common/FormattedDate.svelte';
	import SongScoreDetails from './SongScoreDetails.svelte';
	import Icons from '../Song/Icons.svelte';
	import PlayerPerformance from './PlayerPerformance.svelte';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
	import {navigate} from 'svelte-routing';
	import {configStore} from '../../stores/config';

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

	$: leaderboard = opt(songScore, 'leaderboard', null);
	$: score = opt(songScore, 'score', null);
	$: prevScore = score?.scoreImprovement?.timeset?.length && score?.scoreImprovement?.score ? score.scoreImprovement : null;
	$: beatSavior = opt(songScore, 'beatSavior', null);
	$: hash = opt(leaderboard, 'song.hash');
	$: twitchUrl = opt(songScore, 'twitchVideo.url', null);
	$: diffInfo = opt(leaderboard, 'diffInfo');
	$: modifiers = leaderboard?.difficultyBl?.modifierValues ?? null;

	$: isPlayerScore = $account?.id && $account?.id === score?.playerId;
	$: serviceIcon = score?.metadata ?? null;
	$: selectedIcons = icons ?? ($configStore && visibleScoreIcons($configStore.visibleScoreIcons));
	$: showReplayCounter = replayCounter && $configStore?.scorePreferences.showReplayCounter;
</script>

{#if songScore}
	<div
		class={`song-score row-${idx} ${inList ? 'score-in-list' : ''}`}
		in:maybe={{fn: fly, x: animationSign * 300, delay: idx * 30, duration: 300}}
		out:maybe={{fn: fade, duration: 100}}
		class:with-details={showDetails}>
		{#if showReplayCounter}
			<h3 class="pin-description desktop-and-up" title="Replay watch count">
				<i class="fas fa-eye" />
				{score.replaysWatched}
			</h3>
		{/if}
		{#if !noIcons}
			<div class="up-to-tablet icons">
				{#if showReplayCounter}
					<h3 class="pin-description" title="Replay watch count">
						<i class="fas fa-eye" />
						{score.replaysWatched}
					</h3>
				{/if}
				<Icons
					layoutType="flat"
					{hash}
					{twitchUrl}
					{diffInfo}
					scoreId={score.id}
					icons={selectedIcons}
					{serviceIcon}
					noPin={!isPlayerScore}
					on:score-pinned={onScorePinned} />
			</div>
		{/if}

		<div class="main" class:beat-savior={service === 'beatsavior'} class:accsaber={service === 'accsaber'}>
			<span class="rank">
				{#if service !== 'beatsavior'}
					<ScoreRank
						rank={score.rank}
						countryRank={score.ssplCountryRank}
						countryRankTotal={null}
						hmd={score.hmd}
						controller={score.controller}
						platform={score.platform} />
				{/if}

				<div class="timeset tablet-and-up">
					<FormattedDate date={score.timeSet} prevPrefix="vs " prevDate={prevScore?.timeSet ?? null} absolute={service === 'beatsavior'} />
				</div>
			</span>

			<span class="timeset mobile-only">
				<FormattedDate date={score.timeSet} prevPrefix="vs " prevDate={prevScore?.timeSet ?? null} absolute={service === 'beatsavior'} />
			</span>

			<span class="song">
				<div>
					{#if showSong}
						{#if withPlayers}
							<div class="player">
								<PlayerNameWithFlag
									player={songScore.player}
									type={service === 'accsaber' ? 'accsaber/date' : null}
									on:click={() => navigateToPlayer(songScore.player.playerId)} />
							</div>
						{/if}

						<SongInfo
							{leaderboard}
							{score}
							rank={score.rank}
							{hash}
							{twitchUrl}
							notClickable={['beatsavior'].includes(service)}
							{noIcons}
							category={leaderboard?.categoryDisplayName ?? null}
							{service}
							{playerId}
							icons={selectedIcons}
							on:score-pinned={onScorePinned} />
					{/if}
				</div>
			</span>

			<div class="score-options-section">
				<span
					class="beat-savior-reveal clickable"
					class:opened={showDetails}
					on:click={() => (showDetails = !showDetails)}
					title="Show details">
					<i class="fas fa-chevron-down" />
				</span>
			</div>

			<PlayerPerformance {service} {songScore} {showDetails} {modifiers} {additionalStat} on:badge-click />
		</div>

		{#if showDetails}
			<div transition:slide>
				<SongScoreDetails
					{playerId}
					{songScore}
					{fixedBrowserTitle}
					noSsLeaderboard={['beatsavior', 'accsaber'].includes(service)}
					showAccSaberLeaderboard={'accsaber' === service} />
			</div>
		{/if}
	</div>
{/if}

<style>
	.score-in-list {
		border-bottom: 1px solid var(--row-separator);
		padding: 0.5em 0;
	}

	.song-score .up-to-tablet + .main {
		padding-top: 0;
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

	.rank {
		width: 5.5em;
		text-align: center;
	}

	.song {
		flex-grow: 1;
		min-width: 15.25em;
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

	.player {
		text-align: left;
		padding-bottom: 0.5rem;
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

	@media screen and (max-width: 1023px) {
		.icons {
			display: flex;
			align-items: center;
			margin-bottom: 0.5em;
		}
		.up-to-tablet {
			display: flex;
		}
	}

	@media screen and (max-width: 767px) {
		.song-score {
			padding: 0.75em 0;
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

		.up-to-tablet {
			margin-bottom: 0.5em;
		}

		.player {
			text-align: center;
		}
	}
</style>
