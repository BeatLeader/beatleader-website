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

<div class="leader-container">
	<section class="header">Stats</section>
	<div class="stats-list">
		<div class="stat-set">
			<span class="maps-title">Platform</span>
			<section class="title is-6">{topPlatform}</section>
		</div>
		<div class="stat-set">
			<span class="maps-title">Headset</span>
			<div class="hmd">
				<div class="hmd-image-container">
					<img src={'/assets/' + headset?.icon} alt={headset?.name} style={headsetStyle} />
				</div>
				<section class="title is-6">{headset?.name}</section>
			</div>
		</div>
		<div class="stat-set">
			<span class="maps-title">Replay views</span>
			<section class="title is-6">{myreplays} views</section>
		</div>
		<div class="stat-set">
			<span class="maps-title">Replays viewed</span>
			<section class="title is-6">{mywatched} replays</section>
		</div>
	</div>
</div>

<style>
	.leader-container {
		display: flex;
		flex-direction: column;
		padding: 0.5em;
		background-color: #353535;
		border-radius: 1em;
		gap: 0.5em;
		max-height: 6em;
		max-width: 28em;
		min-width: min(28em, 100%);
	}

	.header {
		font-size: 1rem;
		margin-bottom: 0;
		font-weight: 700;
	}

	.stats-list {
		display: flex;
		gap: 1em;
	}

	.stat-set {
		display: flex;
		flex-direction: column;
		gap: 0.3em;
	}

	@media screen and (max-width: 450px) {
		.is-6 {
			font-size: 0.8em;
		}

		.hmd-image-container {
			font-size: 0.8em;
		}

		.leader-container {
			max-height: none;
		}
	}

	@media screen and (max-width: 380px) {
		.is-6 {
			font-size: 0.7em;
		}

		.maps-title {
			font-size: 0.75em !important;
		}

		.hmd-image-container {
			font-size: 0.7em;
		}
	}

	.vertical-set {
		display: flex;
		flex-direction: column;
		gap: 0.6em;
	}

	.hmd {
		display: flex;
		gap: 0.2em;
	}

	.maps-title {
		font-size: small;
		font-weight: 600;
		text-decoration-line: underline;
	}
</style>
