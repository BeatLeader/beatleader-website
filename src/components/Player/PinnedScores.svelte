<script>
	import ContentBox from '../Common/ContentBox.svelte';
	import PinnedScore from './PinnedScore.svelte';
	import PinnedPlaylists from './PinnedPlaylists.svelte';
	import PinnedTabs from './PinnedTabs.svelte';

	const TABS = [
		{id: 'scores', label: 'Scores', icon: '<i class="fa-solid fa-thumbtack"></i>'},
		{id: 'playlists', label: 'Playlists', icon: '<i class="fa-solid fa-list-ul"></i>'},
	];

	/**
	 * @typedef {Object} Props
	 * @property {any} playerId
	 * @property {any} [fixedBrowserTitle]
	 * @property {any} pinnedScoresStore
	 * @property {any} [scoresStats]
	 * @property {any[]} [pinnedPlaylists]
	 * @property {boolean} [pinnedPlaylistsEditable]
	 * @property {(pins: any[]) => void} [onPinnedPlaylistsChange]
	 */

	/** @type {Props} */
	let {
		playerId,
		fixedBrowserTitle = null,
		pinnedScoresStore,
		scoresStats = null,
		pinnedPlaylists = [],
		pinnedPlaylistsEditable = false,
		onPinnedPlaylistsChange = null,
	} = $props();

	let tab = $state('scores');

	let sortedPinnedScores = $derived(
		$pinnedScoresStore[playerId]?.sort((a, b) => (a?.score?.metadata?.priority ?? 0) - (b?.score?.metadata?.priority ?? 0)) ?? []
	);

	let hasScores = $derived(sortedPinnedScores.length > 0);
	let hasPlaylists = $derived(pinnedPlaylists?.length > 0);
	let showTabs = $derived(hasScores && hasPlaylists);
	let shownTab = $derived(showTabs ? tab : hasScores ? 'scores' : 'playlists');

	let mywatched = $derived(scoresStats?.watchedReplays);
	let myreplays = $derived(scoresStats?.authorizedReplayWatched + scoresStats?.anonimusReplayWatched);
</script>

{#if hasScores || hasPlaylists}
	<ContentBox cls={showTabs ? 'pinned-scores-box with-tabs' : 'pinned-scores-box'}>
		{#if showTabs}
			<PinnedTabs tabs={TABS} selected={shownTab} onSelect={id => (tab = id)} />
		{/if}

		<section class="pinned-scores">
			{#if !showTabs}<h2>Pinned {shownTab}</h2>{/if}

			{#if shownTab === 'playlists'}
				<PinnedPlaylists {playerId} pins={pinnedPlaylists} editable={pinnedPlaylistsEditable} onChange={onPinnedPlaylistsChange} />
			{:else}
				{#each sortedPinnedScores as songScore, idx ((songScore?.id ?? '') + (songScore?.score?.id ?? ''))}
					<PinnedScore {playerId} {songScore} {idx} length={sortedPinnedScores?.length ?? 0} {fixedBrowserTitle} />
				{/each}
			{/if}
		</section>
		{#if scoresStats && shownTab === 'scores'}
			<div class="views darkened-background">
				<div class="platform-entry">
					<span class="platform-title" title="How many times other players watched my replays">Total:</span>
					{myreplays} views
				</div>
				<div class="platform-entry">
					<span class="platform-title" title="How many replays I watched">I watched:</span>
					{mywatched} replays
				</div>
			</div>
		{/if}
	</ContentBox>
{/if}

<style>
	.pinned-scores h2 {
		font-size: 1.125em;
		text-align: center;
		margin-top: -0.4em;
		margin-bottom: 0.5em;
	}

	.pinned-scores :global(.score-in-list) {
		border-bottom: none !important;
	}

	.pinned-scores :global(.score:last-child) {
		padding-bottom: 0;
	}

	.views {
		display: flex;
		justify-content: center;
		gap: 1em;
		margin: 0 -1em -1em -1em;
		padding: 0.5em;
		border-radius: 0 0 12px 12px;
	}

	.platform-title {
		font-size: small;
		font-weight: 700;
	}

	:global(.pinned-scores-box) {
		border-radius: 12px !important;
	}

	:global(.pinned-scores-box.with-tabs) {
		margin-top: calc(4px + 3.2em) !important;
	}

	@media screen and (max-width: 767px) {
		:global(.pinned-scores-box) {
			border-radius: 0 !important;
		}

		.views {
			border-radius: 0;
			margin-left: -0.8em;
			margin-right: -0.8em;
		}
	}
</style>
