<script>
	import { audio } from "suneditor/src/plugins";
	import { cubicOut, linear } from "svelte/easing";
	import { tweened } from "svelte/motion";
	import { fade, fly } from "svelte/transition";

  export let volume = 0;

  let soundEnabled = false;
  let autoplayEnabled = true;
  let sliderOpen = false;

  let activeRevealTimeouts = [];
  let activeNextTimeouts = [];

  let previewLinks = [];
  let activeSongTimeouts = [];
  let loadingSongTimeout;

  const progressBarX = tweened(0, {
		duration: 3000,
		easing: linear
	});

  const audioPlayerVolume = tweened(0, {
    duration: 500,
    easing: linear
  });

  const audioPlayer = new Audio();
  audioPlayer.onloadeddata = playAudio;
  audioPlayer.onended = loadNextSong;

  function toggleAutoplay() {
    autoplayEnabled = !autoplayEnabled;
    if (!autoplayEnabled) interruptMotion();
  }

  function toggleSound() {
    sliderOpen = !sliderOpen;
  }

  function startAutoRevealCount(event) {
    if (!autoplayEnabled) return;
    activeRevealTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    activeNextTimeouts = [];
    activeRevealTimeouts.push(setTimeout(() => {
      if (autoplayEnabled) event.detail.reveal();
    }, 3500));

    progressBarX.set(0, {
		  duration: 0
	  });
    progressBarX.set(100, {
		  duration: 3500
	  });
  }

  function startAutoNextCount(event) {
    if (!autoplayEnabled) return;
    activeNextTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    activeNextTimeouts = [];
    activeNextTimeouts.push(setTimeout(() => {
      if (autoplayEnabled) event.detail.next();
    }, 9000));

    progressBarX.set(0, {
		  duration: 0
	  });
    progressBarX.set(100, {
		  duration: 9000
	  });
  }

  function startSong(event) {
    if (event?.detail?.previewLinks?.length > 0) {
      previewLinks = event.detail.previewLinks.slice();
      loadNextSong();
    }
  }

  function loadNextSong() {
    if (previewLinks.length > 0) {
      audioPlayer.pause();
      audioPlayer.src = previewLinks[0];
      audioPlayer.load();
      loadingSongTimeout = setTimeout(() => {
        previewLinks.shift();
        loadNextSong();
      }, 1000);
    }
  }

  function playAudio() {
    clearTimeout(loadingSongTimeout);
    activeSongTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    activeSongTimeouts = [];
    audioPlayerVolume.set(0, {
      duration: 0
    });
    audioPlayer.play();
    audioPlayerVolume.set(volume, {
      duration: 2500
    });
    activeSongTimeouts.push(
      setTimeout(() => {
        audioPlayerVolume.set(0, {
          duration: 1500
        });
      }, 8500)
    );
    activeSongTimeouts.push(
      setTimeout(() => {
        previewLinks.shift();
      }, 10000)
    );
  }

  function stopSong(time = 1500) {
    activeSongTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    audioPlayerVolume.set(0, {
      duration: time
    });
    setTimeout(() => {
      audioPlayer.pause();
    }, time);
  }

  function stopSongQuickly() {
    stopSong(500);
  }

  function clearSongs() {
    stopSong();
    previewLinks = [];
  }

  function cardWasRevealed(event) {
    if (event?.detail?.previewLinks?.length > 0) {
      previewLinks.push(...event.detail.previewLinks);
      soundEnabled && audioPlayer.paused ? loadNextSong() : null;
    }
  }

  function interruptMotion() {
    activeRevealTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    activeRevealTimeouts = [];
    activeNextTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    activeNextTimeouts = [];
    progressBarX.set(100, {
      duration: 0
    });
  }

  function setVolume() {
    audioPlayerVolume.set(volume, {
      duration: 0
    });
  }

  $: volume > 0 ? soundEnabled = true : soundEnabled = false;
  $: audioPlayer.volume = $audioPlayerVolume;
</script>

<svelte:window on:startAutoRevealCount={startAutoRevealCount} on:startSong={startSong} on:stopSong={clearSongs} on:cardWasRevealed={cardWasRevealed}
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
    {#if volume > 0}
    <i class="fa-solid fa-volume-high" />
    {:else}
    <i class="fa-solid fa-volume-xmark" />
    {/if}
  </div>

  {#if sliderOpen}
  <div class="volume-slider" transition:fade|global={{duration: 500, easing: cubicOut}}>
    <input type="range" min="0" max="0.25" step="0.01" bind:value={volume} on:input={setVolume} />
  </div>
  {/if}

</div>

<style>
  .buttons {
		display: flex;
		text-align: end;
    position: absolute;
    top: 0.2em;
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

  .volume-slider {
    position: absolute;
    right: -4em;
    display: flex;
    align-items: center;
    margin: 0;
  }

  .volume-slider input[type="range"] {
    width: 5em;
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
  }

  input[type="range"]::-webkit-slider-runnable-track {
    background: rgb(139, 139, 139);
    height: 0.6em;
    border-radius: 0.25em;
    opacity: 0.75;
  }

  input[type="range"]::-moz-range-track {
    background: rgb(139, 139, 139);
    height: 0.6em;
    border-radius: 0.25em;
    opacity: 0.75;
  }

  input[type="range"]::-webkit-slider-thumb {
    transform: translateY(-25%);
    height: 4em;
    width: 4em;
  }

</style>