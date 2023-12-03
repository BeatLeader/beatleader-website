<script>
	import CarouselCard from './CarouselCard.svelte';
	import createContainerStore from '../../stores/container';
	import {onMount} from 'svelte';
	import {navigate} from 'svelte-routing/src/history';

	export let cards;

	export let showNavBullets = true;
	export let autoMoveInterval = null;
	export let showFillerCards = cards.length > 1 ? true : false;
	export let height = '40em';
	export let cardWidthRatio = 0.5;
	export let showButtons = false;

	let halfCardWidthRatio = (1-cardWidthRatio)/2;
	let carouselWidth;
	let mainEl = null;
	let translation = showFillerCards ? carouselWidth * -halfCardWidthRatio : carouselWidth * halfCardWidthRatio;
	let swipeHandlersBinded = false;
	let currentCenteredIndex = 0;
	let maskLeft = "15%";
	let maskRight = "85%";

	const bodyStore = createContainerStore();
	const containerStore = createContainerStore();

	function moveForward() {
		if (currentCenteredIndex + 1 < cards.length) {
			translation -= carouselWidth * cardWidthRatio;
			currentCenteredIndex++;
		}
	}

	function moveBackward() {
		if (currentCenteredIndex - 1 >= 0) {
			translation += carouselWidth * cardWidthRatio;
			currentCenteredIndex--;
		}
	}

	function moveToPosition(index) {
		translation = index * carouselWidth * -cardWidthRatio + (showFillerCards ? carouselWidth * -halfCardWidthRatio : carouselWidth * halfCardWidthRatio);
		currentCenteredIndex = index;
		console.log();
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
			translation -= carouselWidth * cardWidthRatio;
			currentCenteredIndex++;
		} else {
			translation = carouselWidth * cardWidthRatio;
			currentCenteredIndex = 0;
		}
	}

	function handleResize() {
		moveToPosition(currentCenteredIndex);
		if (cardWidthRatio > 0.9) {
			maskLeft = "4%";
			maskRight = "96%";
		} else {
			maskLeft = "15%";
			maskRight = "85%";
		}
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
	$: {
		halfCardWidthRatio = (1-cardWidthRatio)/2;
		handleResize();
	}
</script>

{#if cards && cards.length > 0}
<section
	bind:this={mainEl}
	bind:offsetWidth={carouselWidth}
	on:resize={handleResize}
	class="carousel"
	style="--cards-cnt: {cards.length+2}; --translation: {translation}px; --width: {carouselWidth}px; --carouselHeight: {height}; --cardWidthRatio: {cardWidthRatio}; --maskLeft: {maskLeft}; --maskRight: {maskRight}">
	{#if cards.length > 1 && showNavBullets}
		<div class="bullets">
			{#each cards as card, index}
				<span class:active={index === currentCenteredIndex} on:click={() => moveToPosition(index)} />
			{/each}
			{#if showButtons}
				<div class="button-left" on:click = {moveBackward}>
					<i class="fa-solid fa-arrow-left"></i>
				</div>
				<div class="button-right" on:click = {moveForward}>
					<i class="fa-solid fa-arrow-right"></i>
				</div>
			{/if}
		</div>
	{/if}
	

	<div class="cards-wrapper">
		{#if showFillerCards}
			<svelte:component
				this={cards[cards.length-1].component}
				{...cards[cards.length-1].props}
				active={cards.length-1 === currentCenteredIndex}
				clickAction={() => moveToPosition(cards.length-1)}
				nextAction={moveForward} />
		{/if}
		{#each cards as card, index}
			<svelte:component
				this={card.component}
				{...card.props}
				active={index === currentCenteredIndex}
				clickAction={() => moveToPosition(index)}
				nextAction={moveForward} />
		{/each}
		{#if showFillerCards}
			<svelte:component
				this={cards[0].component}
				{...cards[0].props}
				active={0 === currentCenteredIndex}
				clickAction={() => moveToPosition(0)}
				nextAction={moveForward} />
		{/if}
	</div>
</section>
{/if}

<style>
	.carousel {
		width: 100%;
		height: var(--carouselHeight);
		margin-top: -10em;
		margin-bottom: -10em;
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
			white var(--maskLeft),
			white var(--maskRight),
			transparent 100%
		);
    mask-image: linear-gradient(
			90deg,
			transparent 0%,
			white var(--maskLeft),
			white var(--maskRight),
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
		grid-template-columns: repeat(var(--cards-cnt), calc(var(--width) * var(--cardWidthRatio)));
		grid-template-rows: 1fr;
		top: 10em;
		bottom: 10em;
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
		bottom: 10.5em;
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

	.button-left {
		position: absolute;
		left: -1em;
		top: 50%;
		transform: translateY(-50%);
		z-index: 1;
		cursor: pointer;
		filter: drop-shadow(2px 2px 6px rgba(0, 0, 0, 0.85));
	}

	.button-right {
		position: absolute;
		right: -1em;
		top: 50%;
		transform: translateY(-50%);
		z-index: 1;
		cursor: pointer;
		filter: drop-shadow(2px 2px 6px rgba(0, 0, 0, 0.85));
	}
</style>
