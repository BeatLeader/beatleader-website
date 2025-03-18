import {writable} from 'svelte/store';
import {tweened} from 'svelte/motion';
import {cubicOut} from 'svelte/easing';

export let songPlayerStore = null;
export let currentTimeStore = null;

const DEFAULT_STATE = {
	currentHash: null,
	playing: false,
	duration: 0,
	currentTime: 0,
	volume: 0.3,
};

export default () => {
	if (songPlayerStore) return songPlayerStore;

	let currentState = {...DEFAULT_STATE};
	let audio = null;
	currentTimeStore = tweened(0, {duration: 10, easing: cubicOut});

	const {subscribe, set, update} = writable(currentState);

	function cleanup() {
		if (audio) {
			audio.removeEventListener('timeupdate', handleTimeUpdate);
			audio.removeEventListener('loadedmetadata', handleMetadata);
			audio.removeEventListener('ended', handleEnded);
			audio.removeEventListener('pause', handleEnded);
			audio.pause();
			audio.currentTime = 0;

			audio = null;
		}
	}

	function handleTimeUpdate() {
		currentTimeStore.set(audio.currentTime);
	}

	function handleMetadata() {
		update(state => ({...state, duration: audio.duration}));
	}

	function handleEnded() {
		update(state => ({...state, playing: false, currentHash: null}));
	}

	function togglePlay(hash) {
		update(state => {
			const isPlaying = hash == state.currentHash ? !state.playing : true;

			if (hash !== state.currentHash) {
				cleanup();
				currentTimeStore.set(0);
				audio = new Audio(`https://eu.cdn.beatsaver.com/${hash.toLowerCase()}.mp3`);
				audio.volume = state.volume;
				audio.addEventListener('timeupdate', handleTimeUpdate);
				audio.addEventListener('loadedmetadata', handleMetadata);
				audio.addEventListener('ended', handleEnded);
				audio.addEventListener('pause', handleEnded);
			} else if (!audio) {
				audio = new Audio(`https://eu.cdn.beatsaver.com/${hash.toLowerCase()}.mp3`);
				audio.volume = state.volume;
				audio.addEventListener('timeupdate', handleTimeUpdate);
				audio.addEventListener('loadedmetadata', handleMetadata);
				audio.addEventListener('ended', handleEnded);
				audio.addEventListener('pause', handleEnded);
			}

			if (isPlaying) {
				audio?.play();
			} else {
				audio?.pause();
			}

			return {
				...state,
				currentHash: hash,
				playing: isPlaying,
			};
		});
	}

	function setVolume(volume) {
		update(state => {
			if (audio) {
				audio.volume = volume;
			}
			return {...state, volume};
		});
	}

	const reset = () => {
		cleanup();
		set(DEFAULT_STATE);
	};

	songPlayerStore = {
		subscribe,
		togglePlay,
		setVolume,
		reset,
	};

	return songPlayerStore;
};
