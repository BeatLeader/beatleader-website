<script>
	import FaSvgIcon from '../../Common/FaSvgIcon.svelte';
	import Value from '../../Common/Value.svelte';
	import Duration from '../../Song/Duration.svelte';
	import MapRequirementDescription from '../MapRequirementDescription.svelte';

	export let leaderboard;
	export let compact = false;

	let showAllStats = false;
	let lastLeaderboardId = null;

	function calculateHalfJumpDuration(bpm, njs, offset = 0) {
		if (!bpm || !njs) return null;

		let halfjump = 4;
		let num = 60 / bpm;

		if (njs <= 0.01) njs = 10;

		while (njs * num * halfjump > 18) halfjump /= 2;

		halfjump += offset;
		if (halfjump < 0.25) halfjump = 0.25;

		return halfjump;
	}

	function getGameVersionForMapVersion(mapVersion) {
		let versionParts = mapVersion.split('.');
		if (versionParts.length > 1) {
			let majorVersion = parseInt(versionParts[0]);
			switch (majorVersion) {
				case 3:
					return '1.20+';
				case 4:
					return '1.37+';
				default:
					return 'Any';
			}
		} else {
			return 'Unknown';
		}
	}

	$: diff = leaderboard?.difficultyBl;
	$: stats = diff?.difficultyStatistics;
	$: bpm = leaderboard?.song?.bpm;
	$: halfJumpDuration = calculateHalfJumpDuration(bpm, diff?.njs, diff?.noteJumpStartBeatOffset ?? 0);
	$: defaultJumpDistance = halfJumpDuration && bpm && diff?.njs ? (60 / bpm) * halfJumpDuration * diff.njs * 2 : null;
	$: currentLeaderboardId = leaderboard?.leaderboardId ?? null;
	$: if (currentLeaderboardId !== lastLeaderboardId) {
		showAllStats = false;
		lastLeaderboardId = currentLeaderboardId;
	}
	$: if (!compact && showAllStats) {
		showAllStats = false;
	}
	$: showCompactStats = compact && !showAllStats;
	$: hasExpandableStats = Boolean(
		diff?.nps ||
			diff?.peakSustainedEBPM ||
			Number.isFinite(defaultJumpDistance) ||
			diff?.bombs ||
			diff?.chains ||
			diff?.sliders ||
			diff?.walls ||
			diff?.linearPercentage ||
			diff?.multiRating ||
			diff?.mapVersion ||
			leaderboard?.stats?.requirements ||
			Number.isFinite(diff?.offset)
	);
</script>

{#if diff}
	<div class="leaderboard-stats">
		<div class="stats" class:compact={showCompactStats}>
			{#if leaderboard?.song?.duration}
				<div class:stat-item={showCompactStats}>
					<i class="fas fa-clock" /> Duration:
					<strong>
						<Duration value={leaderboard.song.duration} />
					</strong>
				</div>
			{/if}

			{#if diff.notes}
				<div class:stats-row={!showCompactStats} class:stat-item={showCompactStats}>
					<div>
						<FaSvgIcon src="/assets/notecount.svg" cls="custom-icon" /> Notes:
						<strong>
							<Value value={diff.notes} digits={0} />
						</strong>
					</div>

					{#if !showCompactStats && diff.nps}
						<div>
							<span>|</span>
							<strong>
								<Value value={diff.nps} digits={2} />
							</strong>
							<span title="Notes per second">NPS</span>
						</div>
					{/if}
				</div>
			{/if}

			{#if bpm}
				<div class:stats-row={!showCompactStats} class:stat-item={showCompactStats}>
					<div>
						<FaSvgIcon src="/assets/metronome-solid.svg" cls="custom-icon" /> BPM:
						<strong>
							<Value value={bpm} digits={0} />
						</strong>
					</div>
					{#if !showCompactStats && diff.peakSustainedEBPM}
						<div>
							<span>|</span>
							<strong>
								<Value value={diff.peakSustainedEBPM} digits={0} />
							</strong>
							<span title="Peak sustained effective BPM">peak EBPM</span>
						</div>
					{/if}
				</div>
			{/if}

			{#if diff.njs}
				<div class:stat-item={showCompactStats}>
					<FaSvgIcon src="/assets/njs.svg" cls="custom-icon" /> NJS:
					<strong>
						<Value value={diff.njs} digits={2} />
					</strong>
					{#if !showCompactStats && Number.isFinite(defaultJumpDistance)}
						<span>|</span>
						<strong>
							<Value value={defaultJumpDistance} title={`${diff.noteJumpStartBeatOffset ?? 0} offset`} digits={2} />
						</strong>
						<span title="Default map jump distance">default JD</span>
					{/if}
				</div>
			{/if}

			{#if !showCompactStats && diff.bombs}
				<div>
					<i class="fas fa-bomb" /> Bombs:
					<strong>
						<Value value={diff.bombs} digits={0} zero="0" />
					</strong>
				</div>
			{/if}

			{#if !showCompactStats && diff.chains}
				<div>
					<i class="fas fa-link" /> Chain links:
					<strong>
						<Value value={diff.chains} digits={0} />
					</strong>
				</div>
			{/if}

			{#if !showCompactStats && diff.sliders}
				<div>
					<FaSvgIcon src="/assets/arcs.svg" cls="custom-icon" /> Arcs:
					<strong>
						<Value value={diff.sliders} digits={0} />
					</strong>
				</div>
			{/if}

			{#if !showCompactStats && diff.walls}
				<div class="stats-row">
					<div>
						<FaSvgIcon src="/assets/obstacle.svg" cls="custom-icon" /> Obstacles:
						<strong>
							<Value value={diff.walls} digits={0} zero="0" />
						</strong>
					</div>
					{#if stats?.crouchWalls}
						<div>
							<span>|</span>
							<FaSvgIcon src="/assets/crouchwall.svg" cls="custom-icon" /> Crouch:
							<strong>
								<Value value={stats.crouchWalls} title="How many walls that require squatting to pass in a map" digits={0} />
							</strong>
						</div>
					{/if}
					{#if stats?.dodgeWalls}
						<div>
							<span>|</span>
							<FaSvgIcon src="/assets/dodgewall.svg" cls="custom-icon" /> Dodge:
							<strong>
								<Value value={stats.dodgeWalls} title="How many walls that require moving side to side to pass in a map" digits={0} />
							</strong>
						</div>
					{/if}
				</div>
			{/if}

			{#if !showCompactStats && Number.isFinite(diff.offset)}
				<div>
					<i class="fas fa-ruler-horizontal" /> Offset:
					<strong>
						<Value value={diff.offset} digits={2} />
					</strong>
				</div>
			{/if}

			{#if !showCompactStats && (diff.linearPercentage || diff.multiRating)}
				<div class="stats-row">
					{#if diff.linearPercentage}
						<div>
							<FaSvgIcon src="/assets/linear-solid.svg" cls="custom-icon" /> Linearity:
							<strong>
								<Value
									value={diff.linearPercentage * 100}
									title="How linear the map is (ie. what is the fraction of the map notes on the same line)"
									digits={2}
									zero="0" />%
							</strong>
						</div>
					{/if}
					{#if diff.multiRating}
						<div>
							<span>|</span>
							<FaSvgIcon src="/assets/multirating.svg" cls="custom-icon" /> Multi Hits:
							<strong>
								<Value value={diff.multiRating * 100} title="Percentage of multi note hits in a map" digits={2} />%
							</strong>
						</div>
					{/if}
				</div>
			{/if}

			{#if compact && hasExpandableStats}
				<button
					type="button"
					class="stats-toggle {showAllStats ? 'opened' : ''} {leaderboard?.stats?.requirements || diff.mapVersion ? 'has-expandable-stats' : ''}"
					on:click={() => (showAllStats = !showAllStats)}
					title={showAllStats ? 'Hide full stats' : 'Show full stats'}
					aria-label={showAllStats ? 'Hide full stats' : 'Show full stats'}
					aria-expanded={showAllStats}>
					<i class:opened={showAllStats} class="fas fa-chevron-down" />
				</button>
			{/if}
		</div>

		{#if !showCompactStats && (leaderboard?.stats?.requirements || diff.mapVersion)}
			<div class="stats-footer {showAllStats ? 'opened' : ''}">
				{#if !showCompactStats && diff.mapVersion}
					<span class="map-version" title={`Map version, supported by Beat Saber ${getGameVersionForMapVersion(diff.mapVersion)} version`}
						>v{diff.mapVersion}</span>
				{/if}
				{#if !showCompactStats && leaderboard?.stats?.requirements}
					<MapRequirementDescription type={leaderboard?.stats.requirements} />
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.leaderboard-stats {
		display: flex;
		flex-direction: column;
	}

	.stats {
		display: flex;
		justify-content: space-between;
		column-gap: 0.7em;
		padding: 0.5em;
		flex-direction: column;
	}

	.stats.compact {
		flex-direction: row;
		align-items: center;
		justify-content: flex-start;
		row-gap: 0.35em;
	}

	.stat-item {
		white-space: nowrap;
	}

	.stats-row {
		display: flex;
		flex-direction: row;
		gap: 0.3em;
		flex-wrap: wrap;
	}

	.stats-footer {
		display: flex;
		gap: 0.5em;
		flex-wrap: wrap;
		padding-left: 0.5em;
		align-items: center;
	}
	.stats-footer.opened {
		margin-bottom: 0.5em;
	}

	.map-version {
		font-size: 0.85em;
		opacity: 0.85;
	}

	.stats-toggle {
		margin-left: auto;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.8em;
		height: 1.8em;
		padding: 0;
		border: 0;
		border-radius: 999px;
		background: transparent;
		color: inherit;
		cursor: pointer;
	}

	.stats-toggle i {
		transition: transform 200ms ease;
	}

	.stats-toggle.opened {
		margin-top: -2em;
	}

	.stats-toggle.opened.has-expandable-stats {
		margin-top: unset;
		margin-bottom: -2em;
	}

	.stats-toggle i.opened {
		transform: rotate(180deg);
	}

	@media screen and (max-width: 767px) {
		.stats {
			font-size: 0.75em;
		}

		.stats.compact {
			column-gap: 0.2em;
		}
	}
</style>
