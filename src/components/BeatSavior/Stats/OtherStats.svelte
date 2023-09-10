<script>
	import ssrConfig from '../../../ssr-config';
	import {opt} from '../../../utils/js';
	import {formatNumber, padNumber} from '../../../utils/format';
	import {configStore} from '../../../stores/config';
	import Value from '../../Common/Value.svelte';
	import Badge from '../../Common/Badge.svelte';

	export let beatSavior = null;
	export let name = null;
	export let compareTo = null;
	export let compareToName = null;
	export let isAverage = false;

	function formatFailedAt(beatSavior) {
		const endTime = opt(beatSavior, 'trackers.winTracker.endTime');
		const won = opt(beatSavior, 'trackers.winTracker.won', false);
		if (!endTime || won) return null;

		let failedAt = null;
		if (endTime) {
			let minutes = padNumber(Math.floor(endTime / 60));
			let seconds = padNumber(Math.round(endTime - minutes * 60));
			if (seconds >= 60) {
				minutes = padNumber(minutes + 1);
				seconds = padNumber(0);
			}

			failedAt = `${minutes}:${seconds}`;
		}

		return failedAt;
	}

	$: stats = beatSavior ? beatSavior.stats : null;
	$: fc = stats && !stats.miss && !stats.wallHit && !stats.bombHit;
	$: bothHandsStats = stats?.accLeft && stats?.accRight;

	$: jumpDistance = beatSavior ? beatSavior.songJumpDistance : null;
	$: totalMistakes = stats ? stats.miss + stats.wallHit + stats.bombHit : null;
	$: leftBadCuts = isAverage ? stats?.leftBadCuts ?? null : opt(beatSavior, 'trackers.hitTracker.leftBadCuts', null);
	$: leftMissedNotes = isAverage ? stats?.leftMiss ?? null : opt(beatSavior, 'trackers.hitTracker.leftMiss', null);
	$: leftMiss = (leftBadCuts || 0) + (leftMissedNotes || 0);
	$: rightBadCuts = isAverage ? stats?.rightBadCuts ?? null : opt(beatSavior, 'trackers.hitTracker.rightBadCuts', null);
	$: rightMissedNotes = isAverage ? stats?.rightMiss ?? null : opt(beatSavior, 'trackers.hitTracker.rightMiss', null);
	$: rightMiss = (rightBadCuts || 0) + (rightMissedNotes || 0);

	$: compareToStats = compareTo ? compareTo.stats : null;
	$: compareToJumpDistance = opt(compareTo, 'songJumpDistance', null);
	$: compareToFc = compareToStats && !compareToStats.miss && !compareToStats.wallHit && !compareToStats.bombHit;
	$: compareToTotalMistakes = compareToStats ? compareToStats.miss + compareToStats.wallHit + compareToStats.bombHit : null;
	$: compareToLeftBadCuts = opt(compareTo, 'trackers.hitTracker.leftBadCuts', null);
	$: compareToLeftMissedNotes = opt(compareTo, 'trackers.hitTracker.leftMiss', null);
	$: compareToLeftMiss = compareTo ? (compareToLeftBadCuts || 0) + (compareToLeftMissedNotes || 0) : null;
	$: compareToRightBadCuts = opt(compareTo, 'trackers.hitTracker.rightBadCuts', null);
	$: compareToRightMissedNotes = opt(compareTo, 'trackers.hitTracker.rightMiss', null);
	$: compareToRightMiss = compareTo ? (compareToRightBadCuts || 0) + (compareToRightMissedNotes || 0) : null;
	$: failedAt = formatFailedAt(beatSavior);
</script>

{#if stats}
	<div class="stats" style="--left-saber-color: {ssrConfig.leftSaberColor}; --right-saber-color: {ssrConfig.rightSaberColor}">
		{#if isAverage && stats.acc}
			<Badge label="Acc" color="white" bgColor="var(--dimmed)" fluid={true} value={stats?.acc ?? 0} suffix="%" />
		{/if}

		{#if !stats.won}
			<Badge color="red" bgColor="var(--dimmed)" fluid={true} onlyLabel={true}>
				<svelte:fragment slot="label">
					FAIL {#if failedAt} AT {failedAt}{/if}
				</svelte:fragment>
			</Badge>
		{/if}

		{#if !isAverage}
			{#if fc && (!compareToStats || compareToFc)}
				<Badge color="darkorange" bgColor="var(--dimmed)" fluid={true} onlyLabel={true}>
					<svelte:fragment slot="label">FC</svelte:fragment>
				</Badge>
			{/if}
		{:else}
			<Badge label="FC" color="white" bgColor="var(--dimmed)" fluid={true} value={stats?.fc ? stats?.fc * 100 : 0} suffix="%" />
		{/if}

		{#if !fc || isAverage || (compareToStats && !compareToFc)}
			<Badge label="Total mistakes" color="white" bgColor="var(--dimmed)" fluid={true}>
				<svelte:fragment slot="value">
					<Value
						value={totalMistakes}
						digits={isAverage ? 2 : 0}
						prevValue={compareToTotalMistakes}
						prevAbsolute={true}
						prevWithSign={false} />
					{#if bothHandsStats && (stats.miss || (compareToStats && compareToStats.miss))}
						<span class="left addon"
							><Value
								value={leftMiss}
								digits={isAverage ? 2 : 0}
								title="Left hand total mistakes"
								prevValue={compareToLeftMiss}
								prevAbsolute={true}
								prevWithSign={false} /></span>
						<span class="right addon"
							><Value
								value={rightMiss}
								digits={isAverage ? 2 : 0}
								title="Right hand total mistakes"
								prevValue={compareToRightMiss}
								prevAbsolute={true}
								prevWithSign={false} /></span>
					{/if}
				</svelte:fragment>
			</Badge>
			<Badge label="Missed notes" color="white" bgColor="var(--dimmed)" fluid={true}>
				<svelte:fragment slot="value">
					<Value
						value={stats.missedNotes}
						digits={isAverage ? 2 : 0}
						prevValue={compareToStats ? compareToStats.missedNotes : null}
						prevAbsolute={true}
						prevWithSign={false} />
					{#if bothHandsStats && (stats.missedNotes || (compareToStats && compareToStats.missedNotes))}
						<span class="left addon"
							><Value
								value={leftMissedNotes}
								digits={isAverage ? 2 : 0}
								title="Left hand missed notes"
								prevValue={compareToLeftMissedNotes}
								prevAbsolute={true}
								prevWithSign={false} /></span>
						<span class="right addon"
							><Value
								value={rightMissedNotes}
								digits={isAverage ? 2 : 0}
								title="Right hand missed notes"
								prevValue={compareToRightMissedNotes}
								prevAbsolute={true}
								prevWithSign={false} /></span>
					{/if}
				</svelte:fragment>
			</Badge>
			<Badge label="Bad cuts" color="white" bgColor="var(--dimmed)" fluid={true}>
				<svelte:fragment slot="value">
					<Value
						value={stats.badCuts}
						digits={isAverage ? 2 : 0}
						prevValue={compareToStats ? compareToStats.badCuts : null}
						prevAbsolute={true}
						prevWithSign={false} />
					{#if bothHandsStats && (stats.badCuts || (compareToStats && compareToStats.badCuts))}
						<span class="left addon"
							><Value
								value={leftBadCuts}
								digits={isAverage ? 2 : 0}
								title="Left hand bad cuts"
								prevValue={compareToLeftBadCuts}
								prevAbsolute={true}
								prevWithSign={false} /></span>
						<span class="right addon"
							><Value
								value={rightBadCuts}
								digits={isAverage ? 2 : 0}
								title="Right hand bad cuts"
								prevValue={compareToRightBadCuts}
								prevAbsolute={true}
								prevWithSign={false} /></span>
					{/if}
				</svelte:fragment>
			</Badge>

			<Badge label="Bomb hit" color="white" bgColor="var(--dimmed)" fluid={true}>
				<svelte:fragment slot="value">
					<Value
						value={stats.bombHit}
						digits={isAverage ? 3 : 0}
						prevValue={compareToStats ? compareToStats.bombHit : null}
						prevAbsolute={true}
						prevWithSign={false} />
				</svelte:fragment>
			</Badge>

			<Badge label="Wall hit" color="white" bgColor="var(--dimmed)" fluid={true}>
				<svelte:fragment slot="value">
					<Value
						value={stats.wallHit}
						digits={isAverage ? 3 : 0}
						prevValue={compareToStats ? compareToStats.wallHit : null}
						prevAbsolute={true}
						prevWithSign={false} />
				</svelte:fragment>
			</Badge>
		{/if}

		<Badge label="Max combo" color="white" bgColor="var(--dimmed)" fluid={true}>
			<svelte:fragment slot="value">
				<Value
					value={stats.maxCombo}
					digits={isAverage ? 2 : 0}
					prevValue={compareToStats ? compareToStats.maxCombo : null}
					prevAbsolute={true}
					prevWithSign={false} />
			</svelte:fragment>
		</Badge>

		{#if stats.maxStreak > 1}
			<Badge label="115 streak" color="white" bgColor="var(--dimmed)" fluid={true}>
				<svelte:fragment slot="value">
					<Value
						value={stats.maxStreak}
						digits={isAverage ? 2 : 0}
						prevValue={compareToStats ? compareToStats.maxStreak : null}
						prevAbsolute={true}
						prevWithSign={false} />
				</svelte:fragment>
			</Badge>
		{/if}

		<Badge label="Pauses" color="white" bgColor="var(--dimmed)" fluid={true}>
			<svelte:fragment slot="value">
				<Value
					value={stats.pauses}
					digits={isAverage ? 3 : 0}
					prevValue={compareToStats ? compareToStats.pauses : null}
					prevAbsolute={true}
					prevWithSign={false} />
			</svelte:fragment>
		</Badge>

		{#if stats?.fcAcc && !fc}
			<Badge label="FC accuracy" color="white" bgColor="var(--dimmed)" fluid={true}>
				<svelte:fragment slot="value">
					<Value
						value={stats.fcAcc * 100.0}
						digits={2}
						prevValue={compareToStats ? compareToStats.fcAcc * 100 : null}
						prevAbsolute={true}
						prevWithSign={false}
						suffix="%" />
				</svelte:fragment>
			</Badge>
		{/if}

		{#if jumpDistance > 0}
			<Badge label="JD" color="white" bgColor="var(--dimmed)" fluid={true}>
				<svelte:fragment slot="value">
					<Value value={jumpDistance} digits={2} prevValue={compareToJumpDistance} prevAbsolute={true} prevWithSign={false} />
				</svelte:fragment>
			</Badge>
		{/if}
	</div>
{/if}

<style>
	.stats {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
		font-size: 0.9em;
	}

	.stats > * {
		display: inline-block;
		min-width: 5.25em;
		text-align: center;
	}

	.stats :global(.badge .value) {
		font-weight: 500;
	}

	.stats .block {
		margin-bottom: 0;
	}

	.stats .addon {
		padding: 0 0.25em;
		margin-left: 0.5em;
		border-radius: 4px;
		background-color: var(--foreground);
		font-size: 0.75em;
		font-weight: normal;
	}
	.stats .addon + .addon {
		margin-left: 0;
	}
	.stats .addon.left {
		background-color: var(--left-saber-color);
	}
	.stats .addon.right {
		background-color: var(--right-saber-color);
	}

	.stats :global(.value small.prev) {
		display: inline;
		opacity: 0.5;
		margin-left: 0.5em;
		color: var(--textColor);
	}
</style>
