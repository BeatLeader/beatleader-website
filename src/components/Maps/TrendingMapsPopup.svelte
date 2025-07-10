<script>
	import Modal from '../Common/Modal.svelte';
	import MapCard from '../Leaderboards/MapCard.svelte';
	import {createEventDispatcher} from 'svelte';

	export let maps;

	const dispatch = createEventDispatcher();

	$: topToday = maps[0];
	$: topWeek = maps[1];
	$: topVoted = maps[2];
</script>

<Modal showCloseButton={false} closeable on:close={() => dispatch('closed')} width="auto" height="auto">
	<div class="maps-top-container">
		<span class="main-title">Trending</span>
		<div class="maps-table">
			<div class="map-row">
				<span class="map-title">Top played today:</span>
				<MapCard map={topToday} idx={0} nodetails maps3D={false} viewType="maps-table" />
			</div>

			<div class="map-row">
				<span class="map-title">Top played this week:</span>
				<MapCard map={topWeek} idx={1} nodetails maps3D={false} viewType="maps-table" />
			</div>
			<div class="map-row">
				<span class="map-title">Top voted new map:</span>
				<MapCard map={topVoted} idx={2} nodetails maps3D={false} viewType="maps-table" />
			</div>
		</div>
	</div>
</Modal>

<style>
	.maps-top-container {
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.main-title {
		color: white;
		font-size: 3em;
	}

	.map-title {
		font-size: 1.5em;
	}

	.maps-table {
		display: flex;
		flex-direction: column;
		gap: 1.5em;
	}

	:global(.content-box:has(.maps-top-container)) {
		backdrop-filter: none !important;
	}

	@media screen and (max-width: 767px) {
		:global(.maps-top-container .map-card.maps-table) {
			width: 100% !important;
			min-height: 12em !important;
		}

		:global(.ss-modal:has(.maps-top-container)) {
			overflow: hidden !important;
		}
	}
</style>
