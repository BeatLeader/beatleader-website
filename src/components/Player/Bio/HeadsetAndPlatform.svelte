<!-- {key: 'topPlatform', label: 'Platform', title: 'Last 50 scores top platform', bgColor: 'var(--selected)'},
{key: 'topHMD', label: 'Headset', title: 'Last 50 scores top headset', bgColor: 'var(--selected)'}, -->

<script>
	import {getControllerForEnum, getHeadsetForHMD} from '../../../utils/beatleader/format';

	export let playerData;

	$: scoresStats = playerData.scoreStats;
	$: topPlatform = scoresStats.topPlatform;
	$: topHeadset = scoresStats.rawTopHMD;
	$: headset = getHeadsetForHMD(topHeadset);
	$: headsetStyle = `width: 1.2em; height: 1.2em; filter: ${headset?.color}`;
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
			<div class="hmd-image-container">
				<img src={'/assets/' + headset?.icon} alt={headset?.name} style={headsetStyle} />
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
		border: 2px solid;
		max-width: 18em;
		padding: 0.5em;
		border-radius: 20px;
		justify-content: space-between;
	}
	.platform-title {
		font-size: small;
		font-weight: 600;
		text-decoration-line: underline;
	}
	.platform-entry {
		display: flex;
		flex-direction: column;
		min-width: 8em;
	}
</style>
