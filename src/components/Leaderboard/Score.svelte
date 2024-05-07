<script>
	import {createEventDispatcher, getContext} from 'svelte';
	import {navigate} from 'svelte-routing';
	import {getTimeStringColor} from '../../utils/date';
	import {configStore} from '../../stores/config';
	import Button from '../Common/Button.svelte';
	import Badge from '../Common/Badge.svelte';
	import Value from '../Common/Value.svelte';
	import Avatar from '../Common/Avatar.svelte';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
	import ClanBadges from '../Player/ClanBadges.svelte';
	import SongScoreDetails from '../Player/SongScoreDetails.svelte';
	import PlayerPerformance from '../Player/PlayerPerformance.svelte';
	import Preview from '../Common/Preview.svelte';
	import {describePlatform, getControllerForEnum, getHeadsetForHMD} from '../../utils/beatleader/format';

	export let leaderboardId = null;
	export let score = null;
	export let type = 'beatleader';
	export let opened = false;
	export let highlight = false;
	export let sortBy = 'rank';
	export let fixedBrowserTitle = null;
	export let modifiers = null;
	export let noReplayInLeaderboard = false;
	export let battleRoyaleDraft = false;
	export let battleRoyaleDraftList = [];
	export let selectedMetric = null;
	export let hideClans = false;

	const MAX_ROYALE_LIST_LENGTH = 10;

	const dispatch = createEventDispatcher();

	const {open} = getContext('simple-modal');
	const showPreview = previewLink => {
		if (document.body.clientWidth < 800) {
			window.open(previewLink, '_blank');
		} else {
			open(Preview, {previewLink});
		}
	};

	function navigateToPlayer(playerId) {
		if (!playerId) return;

		navigate(`/u/${playerId}`);
	}

	$: priorityModifiers = Object.keys(modifiers ?? {})
		.filter(m => m !== 'modifierId' && (modifiers?.[m] ?? 0) !== 0)
		.map(m => m?.toUpperCase());
	$: mods = score?.score?.mods?.sort((a, b) => (priorityModifiers.includes(a) ? -1 : priorityModifiers.includes(b) ? 1 : 0));
	$: additionalStat = ['pauses', 'maxStreak', 'acc', 'weight', 'weightedPp'].includes(sortBy) ? sortBy : null;
	$: showAdditionalStat =
		(additionalStat &&
			$configStore?.leaderboardPreferences?.badges
				?.slice(0, $configStore?.leaderboardPreferences?.badgeRows ?? 1)
				?.some(row => row.some(col => col?.metric === additionalStat)) === false) ||
		$configStore?.leaderboardPreferences?.show?.date === true ||
		(sortBy === 'date' && $configStore?.leaderboardPreferences?.show?.date === false);
	$: isBot = score?.player?.playerInfo?.bot;

	$: headset = getHeadsetForHMD(score?.score?.hmd);
	$: controllerDescription =
		getControllerForEnum(score?.score?.controller).length > 0 ? ' with ' + getControllerForEnum(score?.score?.controller) : '';
	$: platformDescription = describePlatform(score?.score?.platform);
	$: title = headset?.name + controllerDescription + (platformDescription?.description ? '\n' + platformDescription?.description : '');
	$: headsetStyle = `width: 1.2em; height: 1.2em; filter: ${headset?.color}`;
</script>

{#if score}
	<div class="player-score {isBot ? 'bot' : ''}" class:highlight>
		<div class="mobile-first-line">
			<div class="rank with-badge">
				<Badge
					onlyLabel={true}
					color="white"
					bgColor={score?.score?.rank === 1
						? 'darkgoldenrod'
						: score?.score?.rank === 2
						? '#888'
						: score?.score?.rank === 3
						? 'saddlebrown'
						: score?.score?.rank >= 10000
						? 'small'
						: 'var(--dimmed)'}>
					<span slot="label">
						#<Value value={score?.score?.rank} digits={0} zero="?" />
					</span>
				</Badge>
			</div>
			<div class="player">
				{#if $configStore?.leaderboardPreferences?.show?.hmd !== false && type !== 'accsaber'}
					<div class="hmd-image-container">
						<img src={'/assets/' + headset?.icon} alt={headset?.name} {title} style={headsetStyle} />
					</div>
				{/if}
				{#if $configStore?.leaderboardPreferences?.show?.avatar !== false}
					<Avatar player={score.player} />
				{/if}
				{#if isBot}
					<div class="bot-badge">
						<Badge
							label="BOT"
							onlyLabel={true}
							fluid={true}
							color="white"
							bgColor="blue"
							title="0100100100100111011011010010000001101110011011110111010000100000011010000111010101101101011000010110111000100000011100000110110001100001011110010110010101110010" />
					</div>
				{/if}
				<PlayerNameWithFlag
					player={score.player}
					type={type === 'accsaber' ? 'accsaber/date' : null}
					hideFlag={$configStore?.leaderboardPreferences?.show?.country === false || isBot}
					on:click={score.player ? () => navigateToPlayer(score.player.playerId) : null} />

				{#if !hideClans && $configStore?.leaderboardPreferences?.show?.clans !== false}
					<ClanBadges player={score.player} />
				{/if}
			</div>
			{#if !isBot}
				<div class="timeset">
					{#if showAdditionalStat}
						{#if sortBy == 'pauses'}
							<i class="fa-solid fa-pause" />
							<Value value={score.score.pauses} digits={0} />
						{:else if sortBy == 'maxStreak'}
							<i class="fa-solid fa-crosshairs" />
							<Value value={score.score.maxStreak} digits={0} />
						{:else if sortBy == 'weight'}
							<i class="fa-solid fa-weight-hanging" />
							<Value value={score.score.weight} digits={2} />
						{:else if sortBy == 'weightedPp'}
							<i class="fa-solid fa-cubes" />
							<Value value={score.score.weight * score.score.pp} digits={2} />
						{:else if sortBy == 'mistakes'}
							<i class="icon-mistakes icon-mistakes-mini" />
							<Value
								value={(score.score.badCuts ?? 0) +
									(score.score.missedNotes ?? 0) +
									(score.score.wallsHit ?? 0) +
									(score.score.bombCuts ?? 0)}
								digits={0} />
						{:else if sortBy === 'acc'}
							<Value value={score?.score?.acc} suffix="%" />
						{:else if sortBy === 'date' || $configStore?.leaderboardPreferences?.show?.date === true}
							<span style="color: {getTimeStringColor(score?.score?.timeSet ?? null)}; ">
								<span class="above-tablet">{score?.score.timeSetString ?? '-'}</span>
								<span class="mobile-only">{score?.score.timeSetStringShort ?? '-'}</span>
							</span>
						{/if}
					{/if}
				</div>
			{/if}
		</div>
		<div class="mobile-second-line">
			{#if !noReplayInLeaderboard && type !== 'accsaber'}
				<div class="replay">
					{#if battleRoyaleDraft && $configStore?.leaderboardPreferences?.show?.replay !== false}
						{#if !battleRoyaleDraftList.includes(score?.player?.playerId) && battleRoyaleDraftList.length < MAX_ROYALE_LIST_LENGTH}
							<Button
								cls="replay-button-alt"
								icon="<div class='battleroyalejoin-icon'></div>"
								title="Join battle royal"
								noMargin={true}
								on:click={() => dispatch('royale-add', score.player.playerId)} />
						{:else if battleRoyaleDraftList.includes(score?.player?.playerId)}
							<Button
								cls="replay-button-alt"
								icon="<div class='battleroyalestop-icon'></div>"
								title="Remove from battle royal"
								noMargin={true}
								on:click={() => dispatch('royale-remove', score?.player?.playerId)} />
						{/if}
					{:else}
						{#if $configStore?.leaderboardPreferences?.show?.replay !== false}
							<Button
								url={`${
									$configStore.preferences.webPlayer == 'arcviewer'
										? 'https://allpoland.github.io/ArcViewer/?scoreID='
										: 'https://replay.beatleader.xyz/?scoreId='
								}${score?.score.id}`}
								on:click={() =>
									showPreview(
										`${
											$configStore.preferences.webPlayer == 'arcviewer'
												? 'https://allpoland.github.io/ArcViewer/?scoreID='
												: 'https://replay.beatleader.xyz/?scoreId='
										}${score?.score.id}`
									)}
								cls="replay-button-alt"
								icon="<div class='replay-icon-alt'></div>"
								title="Replay"
								noMargin={true} />
						{/if}

						<span class="beat-savior-reveal clickable" class:opened on:click={() => dispatch('toggle-details')} title="Show details">
							<i class="fas fa-chevron-down" />
						</span>
					{/if}
				</div>
			{/if}

			<PlayerPerformance type="leaderboard-score" service={type} songScore={score} {modifiers} {selectedMetric} on:badge-click />
		</div>
	</div>

	{#if opened}
		<div>
			<SongScoreDetails
				playerId={score?.player?.playerId}
				songScore={score}
				{fixedBrowserTitle}
				noSsLeaderboard={true}
				showAccSaberLeaderboard={false} />
		</div>
	{/if}
{/if}

<style>
	.player-score {
		display: flex;
		flex-direction: row;
		grid-gap: 0.4em;
		padding: 0.2em 0;
		min-width: 19em;
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

	.player-score.highlight {
		background: linear-gradient(45deg, #defb6996, transparent, transparent);
		border-radius: 4px;
		padding: 0.2em;
		margin: 0 -0.2em;
		max-width: 130%;
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

	.player-score .replay {
		height: 1.8em;
		min-width: fit-content;
		margin-right: 0.25em;
		flex: none;
	}

	.player-score .pp {
		min-width: 5.5em;
		flex: none;
	}

	.player-score .percentage {
		min-width: 4.5em;
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

	.pp.with-badge {
		position: relative;
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

	.hmd-image-container {
		display: flex;
		justify-content: center;
		align-items: center;
		align-self: center;
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
