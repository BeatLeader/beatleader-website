<script>
	import {onMount} from 'svelte';
	import {tweened} from 'svelte/motion';
	import {cubicOut} from 'svelte/easing';
	import {createEventDispatcher} from 'svelte';
	import Button from '../../Common/Button.svelte';
	import {fade, fly, slide} from 'svelte/transition';

	export let song;
	export let playing = false;

	const dispatch = createEventDispatcher();
	let audio;
	let currentTime = tweened(0, {duration: 400, easing: cubicOut});
	let duration = song.duration;

	// onMount(() => {
	// 	audio = new Audio(song.previewUrl);
	// 	audio.addEventListener('timeupdate', () => {
	// 		currentTime.set(audio.currentTime);
	// 	});
	// 	audio.addEventListener('loadedmetadata', () => {
	// 		duration = audio.duration;
	// 	});
	// 	audio.addEventListener('ended', () => {
	// 		playing = false;
	// 		dispatch('playing', playing);
	// 	});
	// });

	$: if (playing) {
		audio && audio.play();
	} else {
		audio && audio.pause();
	}

	function togglePlay() {
		playing = !playing;
		dispatch('playing', playing);
	}
</script>

<div class="player">
	<Button iconFa="fas fa-play" cls="song-play-button" square={true} on:click={togglePlay} />
	<div class="timeline">
		<div class="progress" style="width: {($currentTime / duration) * 100}%"></div>
	</div>
	<div class="time">
		{Math.floor($currentTime / 60)}:{Math.floor($currentTime % 60)
			.toString()
			.padStart(2, '0')} / {Math.floor(duration / 60)}:{Math.floor(duration % 60)
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
		transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
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
	}
</style>
