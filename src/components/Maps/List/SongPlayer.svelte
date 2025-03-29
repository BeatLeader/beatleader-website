<script>
	import {onMount} from 'svelte';
	import {tweened} from 'svelte/motion';
	import {cubicOut} from 'svelte/easing';
	import {createEventDispatcher} from 'svelte';
	import Button from '../../Common/Button.svelte';
	import {fade, fly, slide} from 'svelte/transition';
	import {songPlayerStore, currentTimeStore} from '../../../stores/songPlayer';

	export let song;

	$: if (song) {
		isCurrentSong = $songPlayerStore?.currentHash === song.hash;
	}

	let isCurrentSong = false;
	let showVolumeSlider = false;

	function handleTogglePlay() {
		songPlayerStore.togglePlay(song.hash);
	}

	function handleVolumeChange(event) {
		songPlayerStore.setVolume(parseFloat(event.target.value));
	}

	function toggleVolumeSlider() {
		showVolumeSlider = !showVolumeSlider;
	}

	$: currentTime = $songPlayerStore?.currentHash == song.hash ? $currentTimeStore : 0;
</script>

<div class="player">
	<Button
		iconFa={isCurrentSong && $songPlayerStore?.playing ? 'fas fa-pause' : 'fas fa-play'}
		cls="song-play-button"
		square={true}
		on:click={handleTogglePlay} />
	<div class="timeline">
		<div class="progress" style="width: {$songPlayerStore?.currentHash ? (currentTime / $songPlayerStore?.duration) * 100 : 0}%"></div>
	</div>
	<div class="time">
		{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60)
			.toString()
			.padStart(2, '0')} / {Math.floor($songPlayerStore?.duration / 60)}:{Math.floor($songPlayerStore?.duration % 60)
			.toString()
			.padStart(2, '0')}
	</div>
	<div class="volume-control">
		<Button
			iconFa={$songPlayerStore?.volume === 0
				? 'fas fa-volume-mute'
				: $songPlayerStore?.volume < 0.5
					? 'fas fa-volume-down'
					: 'fas fa-volume-up'}
			cls="volume-button"
			square={true}
			on:click={toggleVolumeSlider} />
		{#if showVolumeSlider}
			<div class="volume-slider" transition:fade={{duration: 100}}>
				<input type="range" min="0" max="1" step="0.01" value={$songPlayerStore?.volume} on:input={handleVolumeChange} />
			</div>
		{/if}
	</div>
</div>

<style>
	.player {
		display: flex;
		align-items: center;
		gap: 1em;
		margin-top: 0.25em;
		margin-bottom: 0.25em;
	}
	.timeline {
		flex-grow: 1;
		height: 0.5em;
		background: #dddddd30;
		border-radius: 0.25em;
		overflow: hidden;
		position: relative;
	}
	.progress {
		height: 100%;
		background: #007bff;
	}
	.time {
		font-size: 0.9em;
	}
	.volume-control {
		position: relative;
		display: flex;
		align-items: center;
	}
	.volume-slider {
		position: absolute;
		bottom: 100%;
		right: 0;
		background: #2a2a2a;
		padding: 0.5em;
		border-radius: 0.25em;
		margin-bottom: 0.5em;
		transform-origin: bottom right;
	}
	.volume-slider input[type='range'] {
		writing-mode: bt-lr;
		-webkit-appearance: slider-vertical;
		width: 0.5em;
		height: 100px;
		padding: 0;
	}
	:global(.song-play-button) {
		width: 1.4em !important;
		height: 1.4em !important;
		padding: 0 !important;
		padding-top: 0.15em !important;
		margin-bottom: 0em !important;
		--btn-bg-color: transparent !important;
		--btn-color: #ffffff63 !important;
		--btn-active-bg-color: transparent !important;
	}
	:global(.volume-button) {
		width: 1.4em !important;
		height: 1.4em !important;
		padding: 0 !important;
		padding-top: 0.15em !important;
		margin-bottom: 0em !important;
		--btn-bg-color: transparent !important;
		--btn-color: #ffffff63 !important;
		--btn-active-bg-color: transparent !important;
	}
	:global(.song-play-button:hover),
	:global(.volume-button:hover) {
		--btn-color: #ffffff !important;
	}

	@media (max-width: 768px) {
		.player {
			margin-bottom: 0.1em;
			margin-top: 0.1em;
		}
	}
</style>
