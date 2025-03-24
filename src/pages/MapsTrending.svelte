<script>
	import ContentBox from '../components/Common/ContentBox.svelte';
	import MapCard from '../components/Maps/List/MapCard.svelte';
	import {BL_API_URL} from '../network/queues/beatleader/api-queue';

	let topPlayedToday = [];
	let topPlayedThisWeek = [];
	let topVotedNewMaps = [];
	let topBeatSaverTrending = [];

	let unixNow = Math.floor(Date.now() / 1000);

	let unixOneMonthAgo = unixNow - 60 * 60 * 24 * 30;
	let unixOneWeekAgo = unixNow - 60 * 60 * 24 * 7;
	let unixOneDayAgo = unixNow - 60 * 60 * 24;

	function fetchTrendingMaps() {
		fetch(
			`${BL_API_URL}maps?leaderboardContext=general&page=1&type=all&date_from=${unixOneDayAgo}&date_range=score&sortBy=playcount&order=desc&count=5&allTypes=0&allRequirements=0`
		)
			.then(res => res.json())
			.then(data => {
				topPlayedToday = data.data;
				for (let i = 0; i < topPlayedToday.length; i++) {
					topPlayedToday[i].index = i;
				}
			});

		fetch(
			`${BL_API_URL}maps?leaderboardContext=general&page=1&type=all&date_from=${unixOneWeekAgo}&date_range=score&sortBy=playcount&order=desc&count=5&allTypes=0&allRequirements=0`
		)
			.then(res => res.json())
			.then(data => {
				topPlayedThisWeek = data.data;
				for (let i = 0; i < topPlayedThisWeek.length; i++) {
					topPlayedThisWeek[i].index = i;
				}
			});

		fetch(
			`${BL_API_URL}maps?leaderboardContext=general&page=1&type=all&date_from=${unixOneMonthAgo}&date_range=upload&sortBy=voting&order=desc&count=5&allTypes=0&allRequirements=0`
		)
			.then(res => res.json())
			.then(data => {
				topVotedNewMaps = data.data;
				for (let i = 0; i < topVotedNewMaps.length; i++) {
					topVotedNewMaps[i].index = i;
				}
			});

		fetch(`${BL_API_URL}maps/trending/beatsaver`)
			.then(res => res.json())
			.then(data => {
				topBeatSaverTrending = data.data.slice(0, 5);
				for (let i = 0; i < topBeatSaverTrending.length; i++) {
					topBeatSaverTrending[i].index = i;
				}
			});
	}

	$: fetchTrendingMaps();
</script>

<ContentBox cls="maps-trending-container">
	<div class="maps-trending-section">
		<ContentBox cls="maps-trending-section-box">
			<a href="/maps/all/1?date_from={unixOneDayAgo}&date_range=score&sortBy=playcount" class="maps-trending-section-header">
				<span class="maps-trending-section-title">Top Played Today</span>
				<i class="fas fa-arrow-right"></i>
			</a>
			<div class="maps-trending-list darkened-background">
				{#each topPlayedToday as map, idx (map.index)}
					<div class="maps-trending-section-map {idx != 0 ? 'maps-trending-section-map-not-first' : ''}">
						<div class="maps-trending-section-map-number">{idx + 1}.</div>
						<MapCard {idx} {map} sortBy="playcount" />
					</div>
				{/each}
			</div>
		</ContentBox>
		<ContentBox cls="maps-trending-section-box">
			<a href="/maps/all/1?date_from={unixOneWeekAgo}&date_range=score&sortBy=playcount" class="maps-trending-section-header">
				<span class="maps-trending-section-title">Top Played This Week</span>
				<i class="fas fa-arrow-right"></i>
			</a>
			<div class="maps-trending-list darkened-background">
				{#each topPlayedThisWeek as map, idx (map.index)}
					<div class="maps-trending-section-map {idx != 0 ? 'maps-trending-section-map-not-first' : ''}">
						<div class="maps-trending-section-map-number">{idx + 1}.</div>
						<MapCard {idx} {map} sortBy="playcount" />
					</div>
				{/each}
			</div>
		</ContentBox>
		<ContentBox cls="maps-trending-section-box">
			<a href="/maps/all/1?date_from={unixOneMonthAgo}&date_range=upload&sortBy=voting" class="maps-trending-section-header">
				<span class="maps-trending-section-title">Top Voted New Maps</span>
				<i class="fas fa-arrow-right"></i>
			</a>
			<div class="maps-trending-list darkened-background">
				{#each topVotedNewMaps as map, idx (map.index)}
					<div class="maps-trending-section-map {idx != 0 ? 'maps-trending-section-map-not-first' : ''}">
						<div class="maps-trending-section-map-number">{idx + 1}.</div>
						<MapCard {idx} {map} sortBy="voting" />
					</div>
				{/each}
			</div>
		</ContentBox>
		<ContentBox cls="maps-trending-section-box">
			<a
				href="https://beatsaver.com/?order=Rating&from={new Date(unixOneWeekAgo * 1000).toISOString()}"
				class="maps-trending-section-header">
				<span class="maps-trending-section-title">BeatSaver Trending</span>
				<i class="fas fa-arrow-right"></i>
			</a>
			<div class="maps-trending-list darkened-background">
				{#each topBeatSaverTrending as map, idx (map.index)}
					<div class="maps-trending-section-map {idx != 0 ? 'maps-trending-section-map-not-first' : ''}">
						<div class="maps-trending-section-map-number">{idx + 1}.</div>
						<MapCard {idx} {map} sortBy="upvotes" />
					</div>
				{/each}
			</div>
		</ContentBox>
	</div>
</ContentBox>

<style>
	:global(.maps-trending-section-box) {
		display: flex;
		flex-direction: column;
		gap: 10px;
		transform: scale(0.8);
		margin-left: -2em !important;
		margin-top: -4em !important;
		margin-bottom: -6em !important;
		padding: 0.5em !important;
		border-radius: 12px !important;
	}

	.maps-trending-section {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
	}

	.maps-trending-section-map {
		display: flex;
		flex-direction: row;
		gap: 10px;
	}

	.maps-trending-list {
		border-radius: 10px;
		padding: 0.5em;
	}

	.maps-trending-section-map-number {
		font-size: 1.2em;
		font-weight: bold;
	}

	.maps-trending-section-header {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding-left: 0.2em;
		padding-right: 0.2em;
	}

	.maps-trending-section-title {
		font-size: 1.2em;
		font-weight: bold;
	}
</style>
