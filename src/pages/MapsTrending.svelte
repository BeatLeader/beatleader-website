<script>
	import ContentBox from '../components/Common/ContentBox.svelte';
	import MapCard from '../components/Maps/List/MapCard.svelte';
	import {BL_API_URL} from '../network/queues/beatleader/api-queue';

	let topPlayedToday = [];
	let topPlayedThisWeek = [];
	let topPlayedNewMaps = [];
	let topVotedNewMaps = [];
	let topBeatSaverTrending = [];

	let unixNow = Math.floor(Date.now() / 1000);

	let unixOneMonthAgo = unixNow - 60 * 60 * 24 * 30;
	let unixOneWeekAgo = unixNow - 60 * 60 * 24 * 7;
	let unixOneDayAgo = unixNow - 60 * 60 * 24;

	function fetchTrendingMaps() {
		// Initialize placeholder data for all arrays
		for (let i = 0; i < 5; i++) {
			const placeholderMap = {
				index: i,
				name: 'Loading...',
				artist: 'Unknown Artist',
				hash: '00000000000000000000000000000000',
				cover: 'https://via.placeholder.com/150',
				placeholder: true,
			};

			topPlayedToday.push(placeholderMap);
			topPlayedThisWeek.push({...placeholderMap});
			topVotedNewMaps.push({...placeholderMap});
			topBeatSaverTrending.push({...placeholderMap});
			topPlayedNewMaps.push({...placeholderMap});
		}

		// Force Svelte reactivity
		topPlayedToday = topPlayedToday;
		topPlayedThisWeek = topPlayedThisWeek;
		topVotedNewMaps = topVotedNewMaps;
		topBeatSaverTrending = topBeatSaverTrending;
		topPlayedNewMaps = topPlayedNewMaps;

		fetch(
			`${BL_API_URL}maps?leaderboardContext=general&page=1&type=all&date_from=${unixOneDayAgo}&date_range=score&sortBy=playcount&order=desc&count=5&allTypes=0&allRequirements=0`,
			{credentials: 'include'}
		)
			.then(res => res.json())
			.then(data => {
				for (let i = 0; i < topPlayedToday.length; i++) {
					if (topPlayedToday[i].placeholder && topPlayedToday[i].updateCallback) {
						topPlayedToday[i].updateCallback(data.data[i]);
					}
					topPlayedToday[i] = data.data[i];
					topPlayedToday[i].index = i;
				}
			});

		fetch(
			`${BL_API_URL}maps?leaderboardContext=general&page=1&type=all&date_from=${unixOneWeekAgo}&date_range=score&sortBy=playcount&order=desc&count=5&allTypes=0&allRequirements=0`,
			{credentials: 'include'}
		)
			.then(res => res.json())
			.then(data => {
				for (let i = 0; i < topPlayedThisWeek.length; i++) {
					if (topPlayedThisWeek[i].placeholder && topPlayedThisWeek[i].updateCallback) {
						topPlayedThisWeek[i].updateCallback(data.data[i]);
					}
					topPlayedThisWeek[i] = data.data[i];
					topPlayedThisWeek[i].index = i;
				}
			});

		fetch(
			`${BL_API_URL}maps?leaderboardContext=general&page=1&type=all&date_from=${unixOneMonthAgo}&date_range=upload&sortBy=voting&order=desc&count=5&allTypes=0&allRequirements=0`,
			{credentials: 'include'}
		)
			.then(res => res.json())
			.then(data => {
				for (let i = 0; i < topVotedNewMaps.length; i++) {
					if (topVotedNewMaps[i].placeholder && topVotedNewMaps[i].updateCallback) {
						topVotedNewMaps[i].updateCallback(data.data[i]);
					}
					topVotedNewMaps[i] = data.data[i];
					topVotedNewMaps[i].index = i;
				}
			});

		fetch(
			`${BL_API_URL}maps?leaderboardContext=general&page=1&type=all&date_from=${unixOneWeekAgo}&date_range=upload&sortBy=playcount&order=desc&count=5&allTypes=0&allRequirements=0`,
			{credentials: 'include'}
		)
			.then(res => res.json())
			.then(data => {
				for (let i = 0; i < topPlayedNewMaps.length; i++) {
					if (topPlayedNewMaps[i].placeholder && topPlayedNewMaps[i].updateCallback) {
						topPlayedNewMaps[i].updateCallback(data.data[i]);
					}
					topPlayedNewMaps[i] = data.data[i];
					topPlayedNewMaps[i].index = i;
				}
			});

		fetch(`${BL_API_URL}maps/trending/beatsaver`, {credentials: 'include'})
			.then(res => res.json())
			.then(data => {
				const trendingData = data.data.slice(0, 5);
				for (let i = 0; i < topBeatSaverTrending.length; i++) {
					if (topBeatSaverTrending[i].placeholder && topBeatSaverTrending[i].updateCallback) {
						topBeatSaverTrending[i].updateCallback(trendingData[i]);
					}
					topBeatSaverTrending[i] = trendingData[i];
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
			<a href="/maps/all/1?date_from={unixOneWeekAgo}&date_range=upload&sortBy=playcount" class="maps-trending-section-header">
				<span class="maps-trending-section-title">Top Played New Maps</span>
				<i class="fas fa-arrow-right"></i>
			</a>
			<div class="maps-trending-list darkened-background">
				{#each topPlayedNewMaps as map, idx (map.index)}
					<div class="maps-trending-section-map {idx != 0 ? 'maps-trending-section-map-not-first' : ''}">
						<div class="maps-trending-section-map-number">{idx + 1}.</div>
						<MapCard {idx} {map} sortBy="playcount" />
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
	</div>
</ContentBox>

<style>
	:global(.maps-trending-section-box) {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 0.5em !important;
		border-radius: 12px !important;
	}

	.maps-trending-section {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		transform: scale(0.8);
		margin: -12em -10em 0em;
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

	@media screen and (max-width: 910px) {
		.maps-trending-section {
			flex-direction: column;
			transform: none;
			margin: 0;
		}

		:global(.maps-trending-section-box) {
			margin: 0 !important;
			padding: 0 !important;
			margin-top: 1em !important;
		}

		:global(.maps-trending-container) {
			margin: 0 !important;
			padding: 0 !important;
			border-radius: 0 !important;
		}

		.maps-trending-section-map-number {
			display: none;
		}

		.maps-trending-list {
			border-radius: 0;
			padding: 0;
		}
	}
</style>
