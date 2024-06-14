<script>
	import {getContext, createEventDispatcher} from 'svelte';

	import ContentBox from '../../Common/ContentBox.svelte';
	import Carousel from '../../Common/Carousel.svelte';
	import Bio from './Bio.svelte';
	import PlayerCards from './PlayerCards.svelte';
	import Achievements from '../Achievements.svelte';

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

	function updateSwipeCards(playerId, playerInfo, edit, pageContainer, horizontalRichBio) {
		var cards = [];
		if (playerInfo?.richBioTimeset || edit) {
			cards.push({
				name: `richbio-${playerId}`,
				component: Bio,
				props: {playerId, playerInfo, edit, onHorizontalChanged},
			});
		}

		if (pageContainer.name !== 'xxl' && ((!playerInfo?.richBioTimeset && !edit) || horizontalRichBio)) {
			cards.push({
				name: `cards-${playerId}`,
				component: PlayerCards,
				props: {playerId, playerInfo},
			});
		}

		if (pageContainer.name !== 'xxl') {
			cards.push({
				name: `achievements-${playerId}`,
				component: Achievements,
				props: {playerId},
			});
		}

		swipeCards = cards;
	}

	$: onHorizontalChanged(playerInfo?.horizontalRichBio);
	$: updateSwipeCards(playerId, playerInfo, edit, $pageContainer, horizontalRichBio);
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
</style>
