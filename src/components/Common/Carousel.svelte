<script>
  import createContainerStore from '../../stores/container'
  import {onMount} from 'svelte'

  export let cards = null;

  let mainEl = null;
  let swipeHandlersBinded = false;
  let currentItem = 0;
  let carouselHeight = 0;

  const containerStore = createContainerStore();

  async function updateHeight(carousel, item, delay = 0) {
    if (!carousel) return;

    const setHeight = () => {
      const itemNode = carousel.querySelector(`.cards-wrapper > div:nth-child(${item + 1})`);
      if (!itemNode) return;

      const rect = itemNode.getBoundingClientRect();
      if (rect.height) carouselHeight = rect.height;
    }

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
    }
  })

  $: if (mainEl) {
    containerStore.observe(mainEl)
    if (!swipeHandlersBinded) {
      mainEl.addEventListener('swiped-left', swipeLeft);
      mainEl.addEventListener('swiped-right', swipeRight);

      swipeHandlersBinded = true;
    }
  }
  $: cards, currentItem = 0;
  $: cardsHash = cards ? cards.map(c => c.name).join(':') : null;
  $: updateHeight(mainEl, currentItem, cards && cards[currentItem] && cardsHash ? cards[currentItem].delay || 0 : 0)
</script>

{#if cards && cards.length}
  <section bind:this={mainEl} class="carousel"
           style="--cards-cnt: {cards.length}; --width: {$containerStore.nodeWidth}px; --height: {carouselHeight}px; --item:{currentItem}"
           data-swipe-threshold="50"
  >
    <div class="cards-wrapper">
      {#each cards as card, cardIdx (card.name)}
        {#key card.name}
          <div>
            <svelte:component this={card.component} {...card.props} on:height-changed={onCardHeightChanged}/>
          </div>
        {/key}
      {/each}
    </div>

    {#if cards.length > 1}
      <div class="bullets">
        {#each cards as card, cardIdx}
          <span class:active={cardIdx === currentItem} on:click={() => currentItem = cardIdx}></span>
        {/each}
      </div>
    {/if}
  </section>
{/if}

<style>
    .carousel {
        width: 100%;
        min-height: 120px;
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
        margin-top: 1em;
        text-align: center;
    }

    .bullets > span {
        display: inline-block;
        width: 1em;
        height: 1em;
        background-color: var(--dimmed);
        border-radius: 50%;
        cursor: pointer;
        margin: 0 .25em;
        transition: background-color 300ms;
    }

    .bullets > span.active {
        background-color: var(--textColor);
    }
</style>