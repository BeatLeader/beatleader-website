<script>
	import CarouselCard from "./CarouselCard.svelte";
  import createContainerStore from '../../stores/container';
  import {onMount} from 'svelte';
	import { navigate } from "svelte-routing/src/history";

  export let cards = [
    {
      title: "Card 1",
      body: "Card 1 description",
      imageUrl: "/assets/landing-big.jpg",
      targetUrl: undefined
    },
    {
      title: "Card 2",
      body: "Card 2 description",
      imageUrl: "https://www.beatleader.xyz/assets/landing-big-developer.jpg",
      targetUrl: "/leaderboard/global/345b9xx91/1"
    },
    {
      title: "Card 3",
      body: "Card 3 description",
      imageUrl: "/assets/landing-big.jpg",
      targetUrl: undefined
    }
  ]

  let mainEl = null;
  let translation = 25;
  let swipeHandlersBinded = false;
  let currentCenteredIndex = 0;
  let totalCards = 3;

  const bodyStore = createContainerStore();
	const containerStore = createContainerStore();

  function moveForward() {
    if (currentCenteredIndex + 1 < totalCards) {
      translation -= 50;
      currentCenteredIndex++;
    }
  }

  function moveBackward() {
    if (currentCenteredIndex - 1 >= 0) {
      translation += 50;
      currentCenteredIndex--;
    }
  }

  function moveToPosition(index) {
    translation = index * -50 + 25;
    currentCenteredIndex = index;
  }

  function moveOrOpen(index, url) {
    if (currentCenteredIndex == index) {
      if (url) navigate(url);
    } else {
      moveToPosition(index);
    }
  }

  onMount(() => {
		return () => {
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
  class="carousel"
  style="--cards-cnt: {3}; --translation: {translation}%;">

  <div class="cards-wrapper">
    {#each cards as card, index}
      <CarouselCard
        title={card.title}
        body={card.body}
        imageUrl={card.imageUrl}
        on:click = {() => moveOrOpen(index, card.targetUrl)}
      />
    {/each}
  </div>

</section>

<div on:click = {moveForward} style="height: 24px; background: black;"> Move forward </div>
<div on:click = {moveBackward} style="height: 24px; background: black;"> Move backward </div>
<div on:click = {() => moveToPosition(0)} style="height: 24px; background: black;"> Move to 0 </div>
<div on:click = {() => moveToPosition(1)} style="height: 24px; background: black;"> Move to 1 </div>
<div on:click = {() => moveToPosition(2)} style="height: 24px; background: black;"> Move to 2 </div>

<style>
  .carousel {
    width: 100%;
    height: 20em;
    background: #232323 !important;
    position: relative;
    overflow: hidden;
    display: block;
  }
  
  .carousel:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    pointer-events: none;
    background: linear-gradient(90deg, rgba(35,35,35,1) 0%, rgba(0,0,0,0) 15%, rgba(0,0,0,0) 85%, rgba(35,35,35,1) 100%) !important;
  }

  .cards-wrapper {
    display: grid;
		grid-template-columns: repeat(var(--cards-cnt), 50%);
		grid-template-rows: 1fr;
		height: 100%;
		min-height: inherit;
		overflow: visible;
    transform: translateX(var(--translation));
    transition: ease-in-out 300ms;
  }

  .grid-item {
    border: 1px solid white;
    box-sizing: border-box;
    display: flex;
    width: 100%
  }

</style>