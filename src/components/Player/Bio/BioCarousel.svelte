<script>
	import {getContext, createEventDispatcher} from 'svelte';

	import ContentBox from '../../Common/ContentBox.svelte';
	import Carousel from '../../Common/Carousel.svelte';
	import Bio from './Bio.svelte';
	import PlayerCards from './PlayerCards.svelte';
	import Achievements from '../Achievements.svelte';
	import {BL_API_URL} from '../../../network/queues/beatleader/api-queue';
	import {fetchJson} from '../../../network/fetch';

	export let playerId = null;
	export let playerInfo = null;
	export let edit = false;

	const pageContainer = getContext('pageContainer');
	const dispatch = createEventDispatcher();
	let swipeCards = null;

	let horizontalRichBio;

	function onHorizontalChanged(newValue) {
		horizontalRichBio = newValue;
		dispatch('horizontalRichBio-changed', horizontalRichBio);
	}

	let emptyMaps = false;
	let emptyClan = false;

	function updateSwipeCards(playerId, playerInfo, edit, pageContainer, horizontalRichBio, achievements, noMaps, noClan) {
		var cards = [];
		if (playerInfo?.richBioTimeset || edit) {
			cards.push({
				name: `richbio-${playerId}`,
				component: Bio,
				props: {playerId, playerInfo, edit, onHorizontalChanged},
			});
		}

		if (pageContainer.name !== 'xxl' && !(noMaps && noClan) && ((!playerInfo?.richBioTimeset && !edit) || horizontalRichBio)) {
			cards.push({
				name: `cards-${playerId}`,
				component: PlayerCards,
				props: {
					playerId,
					playerInfo,
					onEmptyClan: () => {
						emptyClan = true;
					},
					onEmptyMaps: () => {
						emptyMaps = true;
					},
				},
			});
		}

		if (pageContainer.name !== 'xxl' && achievements?.length) {
			cards.push({
				name: `achievements-${playerId}`,
				component: Achievements,
				props: {achievements},
			});
		}

		swipeCards = cards;
	}

	let achievements = [];

	function fetchAchievements(playerId) {
		emptyMaps = false;
		fetchJson(BL_API_URL + `player/${playerId}/achievements`)
			.then(clientInfo => {
				achievements = clientInfo.body;
			})
			.catch(() => {});
	}

	$: playerId && fetchAchievements(playerId);

	$: onHorizontalChanged(playerInfo?.horizontalRichBio);
	$: updateSwipeCards(playerId, playerInfo, edit, $pageContainer, horizontalRichBio, achievements, emptyMaps, emptyClan);
</script>

<ContentBox cls="bio-box">
	<div class="columns">
		<div class="column">
			<Carousel cards={swipeCards} />
		</div>
	</div>
</ContentBox>

<style>
	.columns {
		width: 100%;
	}
	:global(.bio-box) {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.5em !important;
		border-radius: 12px !important;
		max-width: 100vw;
	}

	:global(.bio-box:has(.bio-and-cards)) {
		display: block !important;
	}

	:global(.bio-box:has(.achievements-section:empty):has(.cards-container:empty)) {
		display: none;
	}
	:global(.bio-box:has(.column:empty)) {
		display: none;
	}
</style>
