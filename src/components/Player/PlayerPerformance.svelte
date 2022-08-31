<script>
	import {configStore} from '../../stores/config';
	import {opt} from '../../utils/js';
	import Badge from '../Common/Badge.svelte';
	import Value from '../Common/Value.svelte';
	import Accuracy from '../Common/Accuracy.svelte';
	import Pp from '../Score/Pp.svelte';
	import {formatNumber, padNumber} from '../../utils/format';
	import FormattedDate from '../Common/FormattedDate.svelte';

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

	export let service = null;
	export let songScore = null;
	export let showDetails = false;
	export let modifiers = null;
	export let unmodifiedScore = false;

	function getBeatSaviorCompatibleStats(score) {
		if (!score?.missedNotes === undefined) return null;

		return {
			stats: {
				accLeft: score?.accLeft ?? null,
				accRight: score?.accRight ?? null,
				badCuts: score?.badCuts ?? null,
				bombHit: score?.bombCuts ?? null,
				fullCombo: !!score?.fullCombo,
				missedNotes: score?.missedNotes ?? null,
				wallHit: score?.wallsHit ?? null,
				miss: score?.badCuts !== undefined || score?.missedNotes !== undefined ? (score?.badCuts ?? 0) + (score?.missedNotes ?? 0) : null,
			},
		};
	}

	$: leaderboard = songScore?.leaderboard ?? null;
	$: score = songScore?.score ?? null;
	$: improvements = score?.scoreImprovement;

	$: modifiedScore = score?.score ?? 0;
	$: prevModifiedScore = modifiedScore - (improvements?.score ?? 0);

	$: beatSavior = songScore?.beatSavior ?? getBeatSaviorCompatibleStats(score);
	$: accLeft = beatSavior?.stats?.accLeft ?? 0;
	$: prevAccLeft = accLeft - (improvements?.accLeft ?? 0);
	$: accRight = beatSavior?.stats?.accRight ?? 0;
	$: prevAccRight = accRight - (improvements?.accRight ?? 0);
	$: failedAt = formatFailedAt(beatSavior);

	$: myScore = score?.myScore ?? null;
	$: myScoreBeatSavior = getBeatSaviorCompatibleStats(myScore?.score);

	$: prevMissedNotes = (beatSavior?.stats?.missedNotes ?? 0) - (improvements?.missedNotes ?? 0);
	$: prevBadCuts = (beatSavior?.stats?.badCuts ?? 0) - (improvements?.badCuts ?? 0);
	$: prevWallsHit = (beatSavior?.stats?.wallHit ?? 0) - (improvements?.wallHit ?? 0);
	$: prevBombHit = (beatSavior?.stats?.bombHit ?? 0) - (improvements?.bombHit ?? 0);

	$: prevMistakes =
		improvements && beatSavior?.stats && improvements.timeset?.length && improvements.score
			? prevMissedNotes + prevBadCuts + prevWallsHit + prevBombHit
			: null;
</script>

<div class="player-performance">
	<div class="player-performance-badges">
		{#if score.pp}
			<span class="pp with-badge">
				<Badge onlyLabel={true} color="white" bgColor="var(--ppColour)">
					<span slot="label">
						<Pp
							playerId={score.playerId}
							leaderboardId={leaderboard.leaderboardId}
							pp={score.pp}
							bonusPp={score.bonusPp}
							weighted={score.ppWeighted}
							{improvements}
							whatIf={score.whatIfPp}
							zero={formatNumber(0)}
							withZeroSuffix={true}
							inline={false}
							color="white" />
					</span>
				</Badge>
			</span>
		{:else if service === 'beatsavior' && beatSavior && !opt(beatSavior, 'trackers.winTracker.won', false)}
			<span class="pp with-badge">
				<Badge onlyLabel={true} color="white" bgColor="var(--decrease)" label="FAIL" title={failedAt ? `Failed at ${failedAt}` : null} />
			</span>
		{:else if service === 'accsaber' && score.ap}
			<span class="pp with-badge">
				<Badge onlyLabel={true} color="white" bgColor="var(--ppColour)">
					<span slot="label">
						<Pp
							playerId={score.playerId}
							leaderboardId={leaderboard.leaderboardId}
							pp={score.ap}
							weighted={score.weightedAp}
							zero={formatNumber(0)}
							withZeroSuffix={true}
							inline={false}
							suffix="AP"
							color="white" />
					</span>
				</Badge>
			</span>
		{:else}
			<span class="pp with-badge" />
		{/if}

		{#if score.acc}
			<span class="acc with-badge">
				<Accuracy {score} {modifiers} />
			</span>
		{:else}
			<span class="acc with-badge" />
		{/if}

		{#if score.score}
			<span class="score with-badge">
				<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
					<span slot="label">
						<Value
							value={unmodifiedScore ? score.unmodifiedScore : modifiedScore}
							prevValue={prevModifiedScore}
							inline={false}
							digits={0} />
					</span>
				</Badge>
			</span>
		{/if}

		{#if accLeft || accRight || Number.isFinite(beatSavior.stats.miss)}
			{#if accLeft}
				<span class="beatSavior with-badge">
					<Badge onlyLabel={true} color="white" bgColor="rgba(168,32,32,1)" inline={true}>
						<span slot="label">
							<Value
								title={beatSavior?.stats?.leftAverageCut
									? `Left accuracy: ${
											beatSavior.stats.leftAverageCut
												? beatSavior.stats.leftAverageCut.map(v => (configStore, $configStore, formatNumber(v))).join('/')
												: ''
									  }`
									: null}
								value={accLeft}
								prevValue={prevAccLeft}
								inline={true}
								digits={2} />
						</span>
					</Badge>
				</span>
			{:else}
				<span class="beatSavior with-badge" />
			{/if}

			{#if accRight}
				<span class="beatSavior with-badge">
					<Badge onlyLabel={true} color="white" bgColor="rgba(32,100,168,1)" inline={true}>
						<span slot="label">
							<Value
								title={beatSavior?.stats?.rightAverageCut
									? `Right accuracy: ${
											beatSavior.stats.rightAverageCut
												? beatSavior.stats.rightAverageCut.map(v => (configStore, $configStore, formatNumber(v))).join('/')
												: ''
									  }`
									: null}
								value={accRight}
								prevValue={prevAccRight}
								inline={true}
								digits={2} />
						</span>
					</Badge>
				</span>
			{:else}
				<span class="beatSavior with-badge" />
			{/if}

			{#if Number.isFinite(beatSavior.stats.miss)}
				<span class="beatSavior with-badge">
					<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
						<span
							slot="label"
							title={`Missed notes: ${beatSavior.stats.missedNotes}, Bad cuts: ${beatSavior.stats.badCuts}, Bomb hit: ${beatSavior.stats.bombHit}, Wall hit: ${beatSavior.stats.wallHit}`}>
							{#if beatSavior.stats.miss || beatSavior.stats.bombHit || beatSavior.stats.wallHit}
								<i class="fas fa-times" />
								<Value
									title={`Missed notes: ${beatSavior.stats.missedNotes}, Bad cuts: ${beatSavior.stats.badCuts}, Bomb hit: ${beatSavior.stats.bombHit}, Wall hit: ${beatSavior.stats.wallHit}`}
									value={beatSavior.stats.miss + beatSavior.stats.wallHit + beatSavior.stats.bombHit}
									prevTitle={`Missed notes: ${prevMissedNotes}, Bad cuts: ${prevBadCuts}, Bomb hit: ${prevBombHit}, Wall hit: ${prevWallsHit}`}
									prevValue={prevMistakes}
									forcePrev={Number.isFinite(prevMistakes)}
									inline={true}
									digits={0}>
									<small slot="prev">
										{#if Number.isFinite(prevMistakes)}
											(vs
											{#if prevMistakes}
												<i class="fas fa-times" /> {formatNumber(prevMistakes, 0)}
											{:else}
												FC
											{/if}
											)
										{/if}
									</small>
								</Value>
							{:else}
								<span class="fc">
									FC
									{#if Number.isFinite(prevMistakes)}
										<small
											title={`Missed notes: ${prevMissedNotes}, Bad cuts: ${prevBadCuts}, Bomb hit: ${prevBombHit}, Wall hit: ${prevWallsHit}`}>
											(vs
											{#if prevMistakes}
												<i class="fas fa-times" /> {formatNumber(prevMistakes, 0)}
											{:else}
												FC
											{/if}
											)
										</small>
									{/if}
								</span>
							{/if}
						</span>
					</Badge>
				</span>
			{:else}
				<span class="beatSavior with-badge" />
			{/if}
		{/if}
	</div>

	{#if (showDetails || (configStore && opt($configStore, 'scoreComparison.method') === 'in-place')) && myScore}
		<span class="compare-player-name">
			<span>
				vs me (<FormattedDate date={myScore?.score?.timeSet} />)
			</span>
		</span>

		<div class="player-performance-badges">
			{#if myScore?.score && myScore?.score.pp}
				<span class="pp with-badge compare">
					<Badge onlyLabel={true} color="white" bgColor="var(--ppColour)">
						<span slot="label">
							<Pp
								playerId={myScore?.playerId}
								leaderboardId={leaderboard.leaderboardId}
								pp={myScore?.score.pp}
								withZeroSuffix={true}
								inline={false}
								color="white" />
						</span>
					</Badge>
				</span>
			{:else}
				<span class="pp with-badge" />
			{/if}

			{#if myScore?.score.acc}
				<span class="acc with-badge compare">
					<Accuracy score={myScore?.score} />
				</span>
			{:else}
				<span class="acc with-badge" />
			{/if}

			{#if myScoreBeatSavior?.stats?.accLeft || myScoreBeatSavior?.stats?.miss === undefined}
				{#if myScore?.score.score}
					<span class="score with-badge compare">
						<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
							<span slot="label">
								<Value
									value={myScore?.score.score}
									inline={false}
									digits={0}
									title={myScore?.score.mods && myScore?.score.mods.length ? `Mods: ${myScore?.score.mods.join(', ')}` : ''} />
							</span>
						</Badge>
					</span>
				{/if}
			{:else if myScoreBeatSavior?.stats?.miss !== undefined}
				<span class="beatSavior with-badge compare">
					<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
						<span
							slot="label"
							title={`Missed notes: ${myScoreBeatSavior.stats.missedNotes}, Bad cuts: ${myScoreBeatSavior.stats.badCuts}, Bomb hit: ${myScoreBeatSavior.stats.bombHit}, Wall hit: ${myScoreBeatSavior.stats.wallHit}`}>
							{#if myScoreBeatSavior.stats.miss || myScoreBeatSavior.stats.bombHit || myScoreBeatSavior.stats.wallHit}
								<i class="fas fa-times" />
								<Value
									title={`Missed notes: ${myScoreBeatSavior.stats.missedNotes}, Bad cuts: ${myScoreBeatSavior.stats.badCuts}, Bomb hit: ${myScoreBeatSavior.stats.bombHit}, Wall hit: ${myScoreBeatSavior.stats.wallHit}`}
									value={myScoreBeatSavior.stats.miss + myScoreBeatSavior.stats.bombHit + myScoreBeatSavior.stats.wallHit}
									inline={false}
									digits={0} />
							{:else if !myScoreBeatSavior.stats.wallHit && !myScoreBeatSavior.stats.bombHit}
								<span class="fc">FC</span>
							{/if}
						</span>
					</Badge>
				</span>
			{:else}
				<span class="beatSavior with-badge compare" />
			{/if}

			{#if myScoreBeatSavior?.stats?.accLeft}
				{#if myScoreBeatSavior?.stats?.accLeft}
					<span class="beatSavior with-badge compare">
						<Badge onlyLabel={true} color="white">
							<span slot="label">
								<Value value={myScoreBeatSavior.stats.accLeft} inline={false} digits={2} />
							</span>
						</Badge>
					</span>
				{/if}

				{#if myScoreBeatSavior?.stats?.accRight}
					<span class="beatSavior with-badge compare">
						<Badge onlyLabel={true} color="white">
							<span slot="label">
								<Value value={myScoreBeatSavior.stats.accRight} inline={false} digits={2} />
							</span>
						</Badge>
					</span>
				{/if}

				{#if myScoreBeatSavior?.stats?.miss !== undefined}
					<span class="beatSavior with-badge compare">
						<Badge onlyLabel={true} color="white" bgColor="var(--dimmed)">
							<span
								slot="label"
								title={`Missed notes: ${myScoreBeatSavior.stats.missedNotes}, Bad cuts: ${myScoreBeatSavior.stats.badCuts}, Bomb hit: ${myScoreBeatSavior.stats.bombHit}, Wall hit: ${myScoreBeatSavior.stats.wallHit}`}>
								{#if myScoreBeatSavior.stats.miss || myScoreBeatSavior.stats.bombHit || myScoreBeatSavior.stats.wallHit}
									<i class="fas fa-times" />
									<Value
										title={`Missed notes: ${myScoreBeatSavior.stats.missedNotes}, Bad cuts: ${myScoreBeatSavior.stats.badCuts}, Bomb hit: ${myScoreBeatSavior.stats.bombHit}, Wall hit: ${myScoreBeatSavior.stats.wallHit}`}
										value={myScoreBeatSavior.stats.miss + myScoreBeatSavior.stats.bombHit + myScoreBeatSavior.stats.wallHit}
										inline={false}
										digits={0} />
								{:else if !myScoreBeatSavior.stats.wallHit && !myScoreBeatSavior.stats.bombHit}
									FC
								{/if}
							</span>
						</Badge>
					</span>
				{/if}
			{/if}
		</div>
	{/if}
</div>

<style>
	.player-performance {
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.player-performance-badges {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		grid-column-gap: 0.4em;
		grid-row-gap: 0.25em;
		min-width: 20rem;
	}

	.beatSavior {
		font-size: 0.85em;
	}

	.beatSavior.with-badge i {
		font-size: 0.875em;
	}

	.beatSavior.with-badge :global(.label) {
		font-size: 0.75em;
	}

	.pp {
		min-width: 5em;
	}

	.pp.with-badge {
		position: relative;
	}

	.acc {
		min-width: 4em;
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

	.compare-player-name {
		color: var(--faded);
		text-align: center;
		font-size: 0.875em;
		border-bottom: 1px solid var(--faded);
		margin-bottom: 0.9em;
		line-height: 1;
	}

	.compare-player-name > span {
		display: inline-block;
		position: relative;
		top: 0.5em;
		background-color: var(--foreground);
		padding: 0 0.5em;
	}

	.player-performance-badges .compare {
		opacity: 0.7;
	}

	.beatSavior.with-badge :global(.badge > .label) {
		width: 100%;
	}
	.beatSavior.with-badge :global(.badge > .label small) {
		margin-left: 0.35em;
	}

	.with-badge :global(.badge > .label small) {
		font-size: 0.875em !important;
	}

	.fc {
		color: yellow;
	}
	.fc small {
		color: white;
	}
</style>
