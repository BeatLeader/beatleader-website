<script>
	import {getContext} from 'svelte';
	import BeatLeaderSwipeCard from './ProfileCards/BeatLeaderSwipeCard.svelte';
	import MiniRankingSwipeCard from './ProfileCards/MiniRankingSwipeCard.svelte';
	import TwitchVideosSwipeCard from './ProfileCards/TwitchVideosSwipeCard.svelte';
	import AccSaberSwipeCard from './ProfileCards/AccSaberSwipeCard.svelte';
	import ContentBox from '../Common/ContentBox.svelte';
	import Carousel from '../Common/Carousel.svelte';
	import {configStore} from '../../stores/config';
	import createAccSaberService from '../../services/accsaber';

	export let twitchVideos = null;
	export let playerId = null;
	export let scoresStats = null;
	export let playerInfo = null;
	export let playerData = null;

	const pageContainer = getContext('pageContainer');
	const accSaberService = createAccSaberService();

	let accSaberPlayerInfo = null;
	let accSaberCategories = null;

	async function updateAccSaberPlayerInfo(playerId) {
		if (!playerId || !(await accSaberService.isDataForPlayerAvailable(playerId))) return;

		accSaberPlayerInfo = await accSaberService.getPlayer(playerId);
		accSaberCategories = await accSaberService.getCategories();
	}

	function generateScoresStats(stats) {
		return stats && stats.length ? stats : [];
	}

	$: swipeCards = [].concat(
		playerId
			? [
					{
						name: `stats-${playerId}`,
						component: BeatLeaderSwipeCard,
						props: {
							playerId,
							playerInfo,
							scoresStats: scoresStatsFinal,
						},
						delay: 500,
					},
			  ]
					.concat(
						$pageContainer.name !== 'xxl' &&
							($configStore.profileParts.friendsMiniRanking ||
								$configStore.profileParts.countryMiniRanking ||
								$configStore.profileParts.globalMiniRanking)
							? [
									{
										name: `ranking-${playerId}`,
										component: MiniRankingSwipeCard,
										props: {player: playerData},
									},
							  ]
							: []
					)
					.concat(
						$configStore.preferences.showAccSaber && accSaberCategories && accSaberPlayerInfo
							? [
									{
										name: `accsaber-${playerId}`,
										component: AccSaberSwipeCard,
										props: {categories: accSaberCategories, playerInfo: accSaberPlayerInfo},
									},
							  ]
							: []
					)
					.concat(
						$pageContainer.name !== 'xxl' && twitchVideos && twitchVideos.length
							? [
									{
										name: `twitch-${playerId}`,
										component: TwitchVideosSwipeCard,
										props: {videos: twitchVideos},
									},
							  ]
							: []
					)
			: []
	);

	$: scoresStatsFinal = generateScoresStats(scoresStats);

	$: updateAccSaberPlayerInfo(playerId);
</script>

<ContentBox cls="charts-box">
	<div class="columns">
		<div class="column">
			<Carousel cards={swipeCards} />
		</div>
	</div>
</ContentBox>

<style>
	:global(.charts-box) {
		padding: 0.5em !important;
		border-radius: 12px !important;
	}

	:global(.charts-box .cards-wrapper) {
		background-color: #121212;
		border-radius: 8px;
	}

	@media screen and (max-width: 767px) {
		:global(.charts-box) {
			border-radius: 0 !important;
		}
	}
</style>
