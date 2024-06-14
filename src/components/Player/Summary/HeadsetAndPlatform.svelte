<!-- {key: 'topPlatform', label: 'Platform', title: 'Last 50 scores top platform', bgColor: 'var(--selected)'},
{key: 'topHMD', label: 'Headset', title: 'Last 50 scores top headset', bgColor: 'var(--selected)'}, -->

<script>
	import {getControllerForEnum, getHeadsetForHMD} from '../../../utils/beatleader/format';

	export let playerData;

	$: scoresStats = playerData.scoreStats;
	$: topPlatform = scoresStats.topPlatform;
	$: topHeadset = scoresStats.rawTopHMD;
	$: headset = getHeadsetForHMD(topHeadset);
	$: headsetStyle = `width: 1.2em; height: 1.2em; margin-bottom: -0.2em; filter: ${headset?.color}`;
	$: topController = scoresStats.topController;
	$: controllerDescription = topController && getControllerForEnum(topController).length > 0 ? getControllerForEnum(topController) : '';

	$: mywatched = scoresStats.watchedReplays;
	$: myreplays = scoresStats.authorizedReplayWatched;
</script>

<div>
	<div class="player-data">
		<div class="platform-entry">
			<span class="platform-title" title="Last 50 scores top platform">Platform</span>
			{topPlatform}
		</div>
		<div class="platform-entry">
			<span class="platform-title" title="Last 50 scores top headset">Headset</span>
			<div class="hmd-container">
				<div class="hmd-image-container">
					<img src={'/assets/' + headset?.icon} alt={headset?.name} style={headsetStyle} />
				</div>
				<span>
					{headset?.name}
				</span>
			</div>
		</div>
		{#if controllerDescription.length}
			<div class="platform-entry">
				<span class="platform-title" title="Last 50 scores top controllers">Controllers</span>
				{controllerDescription}
			</div>
		{/if}
		<div class="platform-entry">
			<span class="platform-title" title="How many times other players watched my replays">My replays</span>
			{myreplays} views
		</div>
		<div class="platform-entry">
			<span class="platform-title" title="How many replays I watched">I watched</span>
			{mywatched} replays
		</div>
	</div>
</div>

<style>
	.player-data {
		display: flex;
		flex-wrap: wrap;
		gap: 0.1em;
		background-color: #121212;
		max-width: 18em;
		min-width: 13em;
		padding: 0.5em;
		border-radius: 8px;
		justify-content: space-between;
	}
	.hmd-container {
		display: flex;
		gap: 0.4em;
	}
	.platform-title {
		font-size: small;
		font-weight: 700;
	}
	.platform-entry {
		display: flex;
		min-width: 4em;
		gap: 0.4em;
		justify-content: space-between;
		align-items: center;
		width: 100%;
	}
</style>
