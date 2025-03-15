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

	function handleTogglePlay() {
		songPlayerStore.togglePlay(song.hash);
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
		<div class="progress" style="width: {(currentTime / $songPlayerStore?.duration) * 100}%"></div>
	</div>
	<div class="time">
		{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60)
			.toString()
			.padStart(2, '0')} / {Math.floor($songPlayerStore?.duration / 60)}:{Math.floor($songPlayerStore?.duration % 60)
			.toString()
			.padStart(2, '0')}
	</div>
</div>

<style>
	.player {
		display: flex;
		align-items: center;
		gap: 1em;
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

	:global(.song-play-button:hover) {
		--btn-color: #ffffff !important;
	}
</style>
