<script>
	import Accuracy from '../Common/PerformanceBadge/Accuracy.svelte';
	import Avatar from '../Common/Avatar.svelte';
	import Badge from '../Common/Badge.svelte';
	import ClanBadges from '../Player/ClanBadges.svelte';
	import ClanName from '../Clans/ClanName.svelte';
	import createClanRankingStore from '../../stores/http/http-clan-ranking-store';
	import {fade, fly} from 'svelte/transition';
	import {flip} from 'svelte/animate';
	import {getTimeStringColor} from '../../utils/date';
	import {navigate} from 'svelte-routing';
	import {opt} from '../../utils/js';
	import Pager from '../Common/Pager.svelte';
	import Pp from '../Common/PerformanceBadge/Pp.svelte';
	import Score from './Score.svelte';
	import Spinner from '../Common/Spinner.svelte';
	import Value from '../Common/Value.svelte';

	import {configStore} from '../../stores/config';
	import SongInfo from '../Player/SongInfo.svelte';
	import ScoreRank from '../Player/ScoreRank.svelte';
	import FormattedDate from '../Common/FormattedDate.svelte';
	import SongScoreDetails from '../Player/SongScoreDetails.svelte';
	import Icons from '../Song/Icons.svelte';
	import PlayerPerformance from '../Player/PlayerPerformance.svelte';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';

	export let cr = null;
	export let idx = null;
	export let fixedBrowserTitle = null;
	export let page;
	export let associatedScoresPage = 1;
	export let itemsPerPage = 5;
	export let sortBy = 'rank';
	export let type = 'clanranking';
	export let noIcons = false;
	export let icons = null;
	export let showSong = true;
	export let inList = true;
	export let additionalStat = null;
	export let animationSign = 1;

	let showDetails = false;

	function visibleScoreIcons(config) {
		var result = [];

		Object.keys(config).forEach(key => {
			if (config[key]) {
				result.push(key);
			}
		});

		return result.filter(i => i != 'replay' && i != 'delete');
	}

	function maybe(node, options) {
		if (animationSign) {
			return options.fn(node, options);
		} else {
			return options.fn(node, {duration: 0, delay: 0, easing: () => 0});
		}
	}

	const clanRankingStore = createClanRankingStore(cr.leaderboard.leaderboardId, cr.id, associatedScoresPage, {});

	function navigateToClan(clanTag) {
		if (!clanTag) return;

		navigate(`/clan/${clanTag}/players/1?`);
	}

	function changeParams(newAssociatedScoresPage) {
		let currAssociatedScoresPage = parseInt(newAssociatedScoresPage, 10);
		if (isNaN(currAssociatedScoresPage)) currAssociatedScoresPage = 1;

		clanRankingStore.fetch(cr.leaderboard.leaderboardId, cr.id, currAssociatedScoresPage, true);
	}

	function onPageChanged(event) {
		if (event.detail.initial || !Number.isFinite(event.detail.page)) return;

		const newAssociatedScoresPage = event.detail.page + 1;
		associatedScoresPage = newAssociatedScoresPage;
		changeParams(newAssociatedScoresPage);
	}

	function onViewAssociatedScores() {
		if (!showClanRankingScores) {
			changeParams(1);
		}
		showClanRankingScores = !showClanRankingScores;
	}

	let openedDetails = [];
	function toggleOpen(scoreId) {
		if (!scoreId) return;

		if (openedDetails.includes(scoreId)) {
			openedDetails = openedDetails.filter(id => id !== scoreId);
		} else {
			openedDetails = [...openedDetails, scoreId];
		}
	}

	let showClanRankingScores = false;

	$: leaderboard = opt(cr, 'leaderboard', null);
	$: hash = leaderboard?.song?.hash;
	$: diffInfo = opt(leaderboard, 'diffInfo');

	$: selectedIcons = icons ?? ($configStore && visibleScoreIcons($configStore.visibleScoreIcons));

	$: scores = $clanRankingStore?.clanRanking?.scores ?? [];
	$: totalItems = $clanRankingStore?.totalItems ?? 0;

	$: isLoading = clanRankingStore.isLoading;
	$: pending = clanRankingStore.pending;
</script>

{#if cr}
	<div class={`player-score ${inList ? 'score-in-list' : ''}`}>

		<span class="rank tablet-and-up">
				<ScoreRank
					rank={cr.rank} />

			<div class="timeset">
				<FormattedDate date={cr.lastUpdateTime} />
			</div>
		</span>

		<span class="song">
			<div>
				<SongInfo
					{leaderboard}
					score={cr}
					rank={cr.rank}
					{hash}
					{noIcons}
					category={leaderboard?.categoryDisplayName ?? null}
					icons={selectedIcons} />
			</div>
		</span>

		{#if !noIcons}
			<div class="up-to-tablet icons">
				<Icons
					layoutType="large"
					{hash}
					{diffInfo}
					icons={selectedIcons}
					noPin={true} />
			</div>
			<div class="mobile-only icons">
				<Icons
					layoutType="flat"
					{hash}
					{diffInfo}
					icons={selectedIcons}
					noPin={true} />
			</div>
		{/if}
		<span class="rank mobile-only">
				<ScoreRank
					rank={cr.rank} />
		</span>

		<span class="timeset mobile-only">
			<FormattedDate date={cr.lastUpdateTimeNumber} />
		</span>


		<div class="mobile-second-line">
			<div class="score-options-section">
				<span
					class="beat-savior-reveal clickable"
					class:opened={showClanRankingScores}
					on:click={onViewAssociatedScores}
					title="Show Scores">
					<i class="fas fa-chevron-down" />
				</span>
			</div>

			<span class="with-badge pp">
				<Badge onlyLabel={true} color="white" bgColor="var(--ppColour)">
					<span slot="label">
						<Pp pp={cr?.pp} inline={false} color="white" />
					</span>
				</Badge>
			</span>

			<span class="with-badge acc">
				<Accuracy accuracyOverride={cr?.averageAccuracy * 100} showMods={false} />
			</span>
		</div>
	</div>
	{#if !$clanRankingStore && $isLoading}
		<div class="align-spinner">
			<Spinner />
		</div>
	{/if}
	{#if $clanRankingStore && !$isLoading}
		{#if showClanRankingScores}
			<div class="scores-subgrid grid-transition-helper">
				{#each scores as score, idx (opt(score, 'score.id', '') + opt(score, 'player.playerId', ''))}
					<div in:fly={{x: 200, delay: idx * 20, duration: 300}} out:fade={{duration: 300}} animate:flip={{duration: 300}}>
						<Score
							leaderboardId={cr.leaderboard.leaderboardId}
							{score}
							{fixedBrowserTitle}
							{sortBy}
							opened={openedDetails.includes(score?.score?.id)}
							on:toggle-details={() => toggleOpen(score?.score?.id)}
							hideClans={true} />
					</div>
				{/each}
				<div class="clan-pager">
					<Pager
						{totalItems}
						{itemsPerPage}
						itemsPerPageValues={null}
						currentPage={associatedScoresPage != 0 ? associatedScoresPage - 1 : 1}
						loadingPage={null}
						mode={scores.length ? 'pages' : 'simple'}
						on:page-changed={onPageChanged} />
				</div>
			</div>
		{/if}
	{/if}
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
	.pp {
		min-width: 5em;
	}

	.acc {
		min-width: 4em;
	}

	.acc :global(.badge .label) {
		min-width: fit-content;
	}

	.clan-pager {
		padding-bottom: 0.4em;
	}

	.score {
		min-width: 5.25em;
	}

	.with-badge {
		text-align: center;
	}

	.with-badge :global(.badge) {
		height: 100%;
	}

	.with-badge :global(.badge > .label small) {
		font-size: 0.875em !important;
	}

	:global(*:not(.compare) > .badge.nominated-pp) {
		border: 2px dashed #ffffffb3;
		--badge-color: transparent !important;
	}

	.player-score {
		display: flex;
		flex-direction: row;
		grid-gap: 0.4em;
		padding: 0.2em 0;
		min-width: 19em;
	}

	.scores-subgrid {
		display: grid;
		grid-template-columns: 1fr;
		max-width: 100%;
		position: relative;
		padding-left: 2em;
	}

	.scores-subgrid > *:not(:last-child) {
		border-bottom: 1px solid var(--row-separator);
	}

	.mobile-first-line {
		display: flex;
		grid-gap: 0.4em;
		align-items: center;
		flex-grow: 1;
		min-width: 0;
	}

	.mobile-second-line {
		display: flex;
		grid-gap: 0.4em;
		align-items: center;
		min-width: max-content;
	}

	.player-score .rank {
		font-size: 0.875em;
		min-width: 2em;
		flex: none;
	}

	.player-score .player {
		display: flex;
		grid-gap: 0.4em;
		flex: 1;
	}

	.player-score .timeset {
		text-align: center;
		min-width: 6.9em;
		flex-basis: fit-content;
	}

	.player-score .pp {
		min-width: 5.5em;
		flex: none;
	}

	.player-score .score {
		min-width: 5em;
		flex: none;
	}

	.player-score .timeset {
		text-align: right;
		min-width: fit-content;
	}

	.player-score :global(.with-badge .badge) {
		margin: 0 !important;
		padding: 0.125em 0.25em !important;
		width: 100%;
		height: 100%;
	}

	.player-score .player > :global(.clan-badges .badge) {
		margin-right: 0.15em !important;
		padding: 0 !important;
		font-size: 0.8em !important;
	}

	.player-score .player > :global(.clan-badges) {
		height: 1.2em !important;
	}

	.player-score :global(.badge small) {
		display: block;
		font-size: 0.7em;
		font-weight: normal;
		margin-top: -2px;
	}

	.player-score :global(.inc),
	.song-score :global(.dec) {
		color: inherit;
	}

	.player-score .player :global(.player-name) {
		cursor: pointer;
	}

	.player-score .player :global(figure) {
		width: 1.5em;
		height: 1.5em;
		min-width: 1.5em;
	}

	.player-score .player :global(.player-name) {
		overflow-x: hidden;
		text-overflow: ellipsis;
	}

	.with-badge {
		height: 100%;
		text-align: center;
	}

	.beat-savior-reveal {
		align-self: end;
		cursor: pointer;
	}

	.beat-savior-reveal > i {
		transition: transform 500ms;
		transform-origin: 0.42em 0.5em;
	}

	.beat-savior-reveal.opened > i {
		transform: rotateZ(180deg);
	}

	.player-score :global(.player-performance-badges .with-badge) {
		min-width: 6em;
	}

	.bot {
		background-color: #8080804d;
	}

	:global(.bot-badge .badge) {
		margin: 0 !important;
		height: 1.2em;
		font-size: 0.9em !important;
	}

	@media screen and (max-width: 767px) {
		.player-score {
			flex-direction: column;
		}

		.player-score .replay {
			order: 1;
		}

		.player-score .pp {
			flex-grow: 1;
		}

		.player-score .percentage {
			flex-grow: 1;
		}

		.player-score .score {
			flex-grow: 1;
		}

		:global(.player .clan-badges) {
			display: none;
		}

		.mobile-second-line :global(.player-performance) {
			width: 100%;
		}
	}
</style>
