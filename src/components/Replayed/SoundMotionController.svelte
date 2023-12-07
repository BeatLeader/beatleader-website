<script>
	import { cubicOut, linear } from "svelte/easing";
	import { tweened } from "svelte/motion";
	import { fade, fly } from "svelte/transition";

  let soundEnabled = false;
  let autoplayEnabled = true;
  let interruptRevealQueued = [];
  let interruptNextQueued = [];

  const progressBarX = tweened(0, {
		duration: 3000,
		easing: linear
	});

  function toggleAutoplay() {
    autoplayEnabled = !autoplayEnabled;
    if (!autoplayEnabled) interruptMotion();
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
  }

  function startAutoRevealCount(event) {
    if (!autoplayEnabled) return;
    setTimeout(() => {
      if (autoplayEnabled && interruptRevealQueued.length === 0) event.detail.reveal();
      interruptRevealQueued.shift();
    }, 3500);

    progressBarX.set(0, {
		  duration: 0
	  });
    progressBarX.set(100, {
		  duration: 3500
	  });
  }

  function startAutoNextCount(event) {
    if (!autoplayEnabled) return;
    setTimeout(() => {
      if (autoplayEnabled && interruptNextQueued.length === 0) event.detail.next();
      interruptNextQueued.shift();
    }, 9000);

    progressBarX.set(0, {
		  duration: 0
	  });
    progressBarX.set(100, {
		  duration: 9000
	  });
  }

  function startSong(event) {
    console.log("startSong", event.detail.previewLink);
  }

  function stopSong(event) {
    console.log("stopSong");
  }

  function cardWasRevealed() {
    
  }

  function interruptMotion(event) {
    switch (event?.detail?.type) {
      case 'reveal':
        interruptRevealQueued.push(true);
        break;
      case 'next':
        interruptNextQueued.push(true);
        break;
      default:
        break;
    }
    progressBarX.set(100, {
      duration: 0
    });
  }


</script>

<svelte:window on:startAutoRevealCount={startAutoRevealCount} on:startSong={startSong} on:stopsong={stopSong} on:cardWasRevealed={cardWasRevealed}
on:startAutoNextCount={startAutoNextCount} on:interruptMotion={interruptMotion}/>

<div class="buttons" transition:fly|global={{y: '100%', duration: 900, easing: cubicOut, opacity: 0}} >
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="toggle-button" on:click={toggleAutoplay}>
    {#if autoplayEnabled}
    <i class="fa-solid fa-pause" />
    {:else}
    <i class="fa-solid fa-play" />
    {/if}
  </div>
  <div class="progress-bar-container">
    {#if $progressBarX !== 100}
    <progress value={$progressBarX} max="100" out:fade|global={{duration: 600, easing: cubicOut}}/>
    {/if}
  </div>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="toggle-button" on:click={toggleSound}>
    {#if soundEnabled}
    <i class="fa-solid fa-volume-high" />
    {:else}
    <i class="fa-solid fa-volume-xmark" />
    {/if}
  </div>

</div>

<style>
  .buttons {
		display: flex;
		text-align: end;
    position: absolute;
    bottom: 0.6em;
    right: 50%;
    transform: translateX(50%);
    -webkit-tap-highlight-color: transparent;
	}

	.toggle-button {
		display: flex;
    align-items: center;
    justify-content: center;
		border-radius: 50%;
    width: 1.5em;
		height: 1.5em;
		cursor: pointer;
    margin: 0;
		margin: 0 0.25em;
    color: white;
    opacity: 0.75;
    background-color: transparent;
	}

  .progress-bar-container {
    position: relative;
    width: 3em;
    height: 0.5em;
    background-color: rgb(139, 139, 139);
    border-radius: 0.25em;
    opacity: 0.75;
    overflow: hidden;
  }

  .progress-bar-container progress {
    background-color: transparent;
    width: 100%;
    height: 100%;
    opacity: 0.75;
    display: block;
  }

  .progress-bar-container progress::-webkit-progress-bar {
    background-color: transparent;
    border-radius: 0.25em;
  }
  .progress-bar-container progress::-webkit-progress-value {
    background-color: white;
    border-radius: 0.25em;
  }
  .progress-bar-container progress::-moz-progress-bar {
    background-color: white;
    border-radius: 0.25em;
  }

</style>