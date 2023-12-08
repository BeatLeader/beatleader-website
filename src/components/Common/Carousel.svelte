<script>
	import {onMount} from 'svelte';

	export let cards = null;
	export let carouselWidth = 0;

	let mainEl = null;
	let swipeHandlersBinded = false;
	let currentItem = 0;
	let carouselHeight = 0;

	async function updateHeight(carousel, item, delay = 0) {
		if (!carousel) return;

		const setHeight = () => {
			const itemNode = carousel.querySelector(`.cards-wrapper > div:nth-child(${item + 1})`);
			if (!itemNode) return;

			const rect = itemNode.getBoundingClientRect();
			if (rect.height) carouselHeight = rect.height;
		};

		if (delay) setHeight();

		setTimeout(setHeight, delay);
	}

	function swipeLeft() {
		if (cards && currentItem < cards.length - 1) currentItem++;
	}

	function swipeRight() {
		if (currentItem > 0) currentItem--;
	}

	function onCardHeightChanged() {
		if (mainEl) updateHeight(mainEl, currentItem);
	}

	onMount(() => {
		return () => {
			if (mainEl) {
				mainEl.removeEventListener('swiped-left', swipeLeft);
				mainEl.removeEventListener('swiped-right', swipeRight);
			}
		};
	});

	let nodeWidth = 500;

	function startObserving(el) {
		if (!el) return;

		if (!swipeHandlersBinded) {
			mainEl.addEventListener('swiped-left', swipeLeft);
			mainEl.addEventListener('swiped-right', swipeRight);

			swipeHandlersBinded = true;
		}
	}

	let bodyWidth = 0;

	function setNodeWIdth(bodyWidth, mainWidth) {
		nodeWidth = bodyWidth < mainWidth ? bodyWidth - 25 : mainWidth;
	}

	$: startObserving(mainEl);
	$: setNodeWIdth(bodyWidth, carouselWidth);
	$: cards, (currentItem = 0);
	$: cardsHash = cards ? cards.map(c => c.name).join(':') : null;
	$: updateHeight(mainEl, currentItem, cards && cards[currentItem] && cardsHash ? cards[currentItem].delay || 0 : 0);
</script>

<svelte:body bind:offsetWidth={bodyWidth} />

{#if cards && cards.length}
	<section
		bind:this={mainEl}
		class="carousel"
		style="--cards-cnt: {cards.length}; width: {nodeWidth}px; --width: {nodeWidth}px; --height: {carouselHeight}px; --item:{currentItem}"
		data-swipe-threshold="50">
		{#if cards.length > 1}
			<div class="bullets">
				{#each cards as card, cardIdx}
					<span class:active={cardIdx === currentItem} on:click={() => (currentItem = cardIdx)} />
				{/each}
			</div>
		{/if}

		<div class="cards-wrapper">
			{#each cards as card, cardIdx (card.name)}
				{#key card.name}
					<div>
						<svelte:component
							this={card.component}
							selected={cardIdx === currentItem}
							{...card.props}
							on:height-changed={onCardHeightChanged}
							on:player-gain-changed />
					</div>
				{/key}
			{/each}
		</div>
	</section>
{/if}

<style>
	.carousel {
		display: flex;
		flex-direction: column;
		grid-gap: 0.6em;
		overflow: hidden;
	}

	.cards-wrapper {
		display: grid;
		grid-template-columns: repeat(var(--cards-cnt), 100%);
		grid-template-rows: 1fr;
		height: var(--height);
		min-height: inherit;
		overflow: hidden;
	}

	.cards-wrapper > div {
		width: 100%;
		height: max-content;
		transition: transform 300ms;
		transition-timing-function: ease-out;
		transform: translate3d(calc(var(--width, 0) * var(--item, 0) * -1), 0, 0);
		overflow: hidden;
	}

	.bullets {
		text-align: center;
	}

	.bullets > span {
		display: inline-block;
		width: 1em;
		height: 1em;
		background-color: var(--dimmed);
		border-radius: 50%;
		cursor: pointer;
		margin: 0 0.25em;
		transition: background-color 300ms;
	}

	.bullets > span.active {
		background-color: var(--textColor);
	}
</style>
