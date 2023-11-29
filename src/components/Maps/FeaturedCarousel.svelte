<script>
	import CarouselCard from './CarouselCard.svelte';
	import createContainerStore from '../../stores/container';
	import {onMount} from 'svelte';
	import {navigate} from 'svelte-routing/src/history';

	export let cards = [
		{
			title: 'Card 1',
			body: 'Card 1 description',
			imageUrl: '/assets/landing-big.jpg',
			targetUrl: undefined,
		},
		{
			title: 'Card 2',
			body: 'Card 2 description',
			imageUrl: 'https://www.beatleader.xyz/assets/landing-big-developer.jpg',
			targetUrl: '/leaderboard/global/345b9xx91/1',
		},
		{
			title: 'Card 3',
			body: 'Card 3 description',
			imageUrl: '/assets/landing-big.jpg',
			targetUrl: undefined,
			buttons: [
				{
					text: 'Button 1',
					type: 'primary',
				},
				{
					text: 'Button 2',
					url: '/leaderboard/global/345b9xx91/1',
				},
			],
		},
		{
			title: 'Card 2',
			body: 'Card 2 description',
			imageUrl: 'https://www.beatleader.xyz/assets/landing-big-developer.jpg',
			targetUrl: '/leaderboard/global/345b9xx91/1',
		},
		{
			title: 'Card 2',
			body: 'Card 2 description',
			imageUrl: 'https://www.beatleader.xyz/assets/landing-big-developer.jpg',
			targetUrl: '/leaderboard/global/345b9xx91/1',
		},
		{
			title: 'Card 2',
			body: 'Card 2 description',
			imageUrl: 'https://www.beatleader.xyz/assets/landing-big-developer.jpg',
			targetUrl: '/leaderboard/global/345b9xx91/1',
		},
		{
			title: 'Card 2',
			body: 'Card 2 description',
			imageUrl: 'https://www.beatleader.xyz/assets/landing-big-developer.jpg',
			targetUrl: '/leaderboard/global/345b9xx91/1',
		},
	];

	export let showNavBullets = true;
	export let autoMoveInterval = null;

	let carouselWidth;
	let mainEl = null;
	let translation = carouselWidth * -0.25;
	let swipeHandlersBinded = false;
	let currentCenteredIndex = 0;

	const bodyStore = createContainerStore();
	const containerStore = createContainerStore();

	function moveForward() {
		if (currentCenteredIndex + 1 < cards.length) {
			translation -= carouselWidth * 0.5;
			currentCenteredIndex++;
		}
	}

	function moveBackward() {
		if (currentCenteredIndex - 1 >= 0) {
			translation += carouselWidth * 0.5;
			currentCenteredIndex--;
		}
	}

	function moveToPosition(index) {
		translation = index * carouselWidth * -0.5 + carouselWidth * -0.25;
		currentCenteredIndex = index;
	}

	function moveOrOpen(index, url) {
		if (currentCenteredIndex == index) {
			if (url) navigate(url);
		} else {
			moveToPosition(index);
		}
	}

	function moveRightOrReset() {
		if (currentCenteredIndex + 1 < cards.length) {
			translation -= carouselWidth * 0.5;
			currentCenteredIndex++;
		} else {
			translation = carouselWidth * 0.5;
			currentCenteredIndex = 0;
		}
	}

	function handleResize() {
		moveToPosition(currentCenteredIndex);
	}

	onMount(() => {
		let intervalId;
		if (autoMoveInterval) {
			intervalId = setInterval(moveRightOrReset, autoMoveInterval);
		}
		window.addEventListener('resize', handleResize);
		handleResize();

		return () => {
			window.removeEventListener('resize', handleResize);
			if (intervalId) clearInterval(intervalId);
			if (mainEl) {
				mainEl.removeEventListener('swiped-left', moveForward);
				mainEl.removeEventListener('swiped-right', moveBackward);
			}
		};
	});

	function startObserving(el) {
		if (!el) return;

		bodyStore.observe(document.body);
		containerStore.observe(el.parentElement);
		if (!swipeHandlersBinded) {
			mainEl.addEventListener('swiped-left', moveForward);
			mainEl.addEventListener('swiped-right', moveBackward);

			swipeHandlersBinded = true;
		}
	}

	$: startObserving(mainEl);
</script>

<section
	bind:this={mainEl}
	bind:offsetWidth={carouselWidth}
	on:resize={handleResize}
	class="carousel"
	style="--cards-cnt: {cards.length+2}; --translation: {translation}px; --width: {carouselWidth}px;">
	{#if cards.length > 1 && showNavBullets}
		<div class="bullets">
			{#each cards as card, index}
				<span class:active={index === currentCenteredIndex} on:click={() => moveToPosition(index)} />
			{/each}
		</div>
	{/if}

	<div class="cards-wrapper">
    <CarouselCard
				title={cards[cards.length-1].title}
				body={cards[cards.length-1].body}
        imageUrl={cards[cards.length-1].imageUrl}
        buttons={cards[cards.length-1].buttons}
				active={cards.length-1 === currentCenteredIndex}
				clickAction={() => moveOrOpen(cards.length-1, cards[cards.length-1].targetUrl)} />
		{#each cards as card, index}
			<CarouselCard
				title={card.title}
				body={card.body}
				imageUrl={card.imageUrl}
				buttons={card.buttons}
				active={index === currentCenteredIndex}
				clickAction={() => moveOrOpen(index, card.targetUrl)} />
		{/each}
    <CarouselCard
				title={cards[0].title}
				body={cards[0].body}
        imageUrl={cards[0].imageUrl}
        buttons={cards[0].buttons}
				active={0 === currentCenteredIndex}
				clickAction={() => moveOrOpen(0, cards[0].targetUrl)} />
	</div>
</section>

<style>
	.carousel {
		width: 100%;
		height: 20em;
		/*background: #232323 !important;*/
		position: relative;
		overflow: visible;
		display: block;
		border-radius: 12px;
		box-shadow: 2px 2px 18px 4px rgba(0, 0, 0, 0.25);
		mask-type: alpha;
		-webkit-mask-image: linear-gradient(
			90deg,
			transparent 0%,
			white 15%,
			white 85%,
			transparent 100%
		);
    mask-image: linear-gradient(
			90deg,
			transparent 0%,
			white 15%,
			white 85%,
			transparent 100%
		);
	}

	/*.carousel:after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: 100%;
		pointer-events: none;
		background: linear-gradient(
			90deg,
			rgba(35, 35, 35, 1) 0%,
			rgba(0, 0, 0, 0) 15%,
			rgba(0, 0, 0, 0) 85%,
			rgba(35, 35, 35, 1) 100%
		) !important;
	}*/

	.cards-wrapper {
		display: grid;
		position: absolute;
		grid-template-columns: repeat(var(--cards-cnt), calc(var(--width) * 0.5));
		grid-template-rows: 1fr;
		height: 100%;
		min-height: inherit;
		overflow: visible;
		transform: translateX(var(--translation));
		transition: ease-in-out 300ms;
	}

	.bullets {
		text-align: center;
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		bottom: 0.5em;
		z-index: 1;
	}

	.bullets > span {
		display: inline-block;
		width: 0.70em;
		height: 0.70em;
		background-color: rgba(111, 111, 111, 0.75);
		border-radius: 50%;
		cursor: pointer;
		margin: 0 0.25em;
		transition: background-color 300ms;
	}

	.bullets > span.active {
		background-color: var(--textColor);
	}
</style>
