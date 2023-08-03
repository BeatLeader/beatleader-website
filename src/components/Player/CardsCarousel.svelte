<script>
	import {getContext} from 'svelte';
	import BeatLeaderSwipeCard from './ProfileCards/BeatLeaderSwipeCard.svelte';
	import MiniRankingSwipeCard from './ProfileCards/MiniRankingSwipeCard.svelte';
	import TwitchVideosSwipeCard from './ProfileCards/TwitchVideosSwipeCard.svelte';
	import AccSaberSwipeCard from './ProfileCards/AccSaberSwipeCard.svelte';
	import BeatSaviorSwipeCard from './ProfileCards/BeatSaviorSwipeCard.svelte';
	import ContentBox from '../Common/ContentBox.svelte';
	import Carousel from '../Common/Carousel.svelte';
	import createBeatSaviorService from '../../services/beatsavior';
	// import createAccSaberService from '../../services/accsaber';

	export let twitchVideos = null;
	export let playerId = null;
	export let scoresStats = null;
	export let ssBadges = null;
	export let playerInfo = null;
	export let playerData = null;

	const pageContainer = getContext('pageContainer');
	const beatSaviorService = createBeatSaviorService();
	// const accSaberService = createAccSaberService();

	// let accSaberPlayerInfo = null;
	// let accSaberCategories = null;

	let isBeatSaviorAvailable = false;

	async function refreshBeatSaviorState(playerId) {
		if (!playerId) return;

		isBeatSaviorAvailable = await beatSaviorService.isDataForPlayerAvailable(playerId);
	}

	// async function updateAccSaberPlayerInfo(playerId) {
	// 	if (!playerId) return;

	// 	accSaberPlayerInfo = await accSaberService.getPlayer(playerId);
	// 	accSaberCategories = await accSaberService.getCategories();
	// }

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
							ssBadges,
						},
						delay: 500,
					},
			  ]
					.concat(
						$pageContainer.name !== 'xxl'
							? [
									{
										name: `ranking-${playerId}`,
										component: MiniRankingSwipeCard,
										props: {player: playerData},
									},
							  ]
							: []
					)
					// .concat(
					// 	accSaberCategories && accSaberPlayerInfo && accSaberCategories.length && accSaberPlayerInfo.length
					// 		? [
					// 				{
					// 					name: `accsaber-${playerId}`,
					// 					component: AccSaberSwipeCard,
					// 					props: {categories: accSaberCategories, playerInfo: accSaberPlayerInfo},
					// 				},
					// 		  ]
					// 		: []
					// )
					.concat(
						isBeatSaviorAvailable
							? [
									{
										name: `beat-savior-${playerId}`,
										component: BeatSaviorSwipeCard,
										props: {playerId},
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
	$: refreshBeatSaviorState(playerId);

	// $: updateAccSaberPlayerInfo(playerId);
</script>

<ContentBox>
	<div class="columns">
		<div class="column">
			<Carousel cards={swipeCards} />
		</div>
	</div>
</ContentBox>
