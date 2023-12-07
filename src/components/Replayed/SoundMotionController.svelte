<script>
	import { audio } from "suneditor/src/plugins";
	import { cubicOut, linear } from "svelte/easing";
	import { tweened } from "svelte/motion";
	import { fade, fly } from "svelte/transition";

  export let volume = 0.25;

  let soundEnabled = false;
  let autoplayEnabled = true;
  let interruptRevealQueued = false;
  let interruptNextQueued = false;
  let revealQueued = false;
  let nextQueued = false;

  let previewLinks = [];
  let activeSongTimeouts = [];

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
    soundEnabled = !soundEnabled;
    soundEnabled ? loadNextSong() : stopSongQuickly();
  }

  function startAutoRevealCount(event) {
    if (!autoplayEnabled) return;
    revealQueued = true;
    setTimeout(() => {
      revealQueued = false;
      if (autoplayEnabled && !interruptRevealQueued) event.detail.reveal();
      interruptRevealQueued = false;
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
    nextQueued = true;
    setTimeout(() => {
      nextQueued = false;
      if (autoplayEnabled && !interruptNextQueued) event.detail.next();
      interruptNextQueued = false;
    }, 9000);

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
      soundEnabled ? loadNextSong() : null;
    }
  }

  function loadNextSong() {
    if (previewLinks.length > 0) {
      audioPlayer.pause();
      audioPlayer.src = previewLinks[0];
      audioPlayer.load();
    }
  }

  function playAudio() {
    activeSongTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
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

  function cardWasRevealed() {
    
  }

  function interruptMotion() {
    revealQueued ? interruptRevealQueued = true : null;
    nextQueued ? interruptNextQueued = true : null;
    progressBarX.set(100, {
      duration: 0
    });
  }

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
    bottom: 0.7em;
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