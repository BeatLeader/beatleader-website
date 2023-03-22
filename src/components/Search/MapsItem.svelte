<script>
	import {createEventDispatcher} from 'svelte';
	import {navigate} from 'svelte-routing';
	import SongCover from '../Player/SongCover.svelte';

	export let item = null;
	export let selected = false;

	const dispatch = createEventDispatcher();

	$: leaderboard = item
		? {
				...item,
				diffInfo: {diff: item?.difficulty?.difficultyName, type: item?.difficulty?.modeName},
				stars: item?.difficulty?.stars ?? null,
		  }
		: null;
	$: leaderboardId = leaderboard?.id ?? '';
	$: leaderboardUrl = `/leaderboard/global/${leaderboardId}/1`;
</script>

{#if item}
	<a
		href={leaderboardUrl}
		on:click|preventDefault|stopPropagation={() => {
			navigate(leaderboardUrl);
			dispatch('close');
		}}>
		<SongCover {leaderboard} notClickable={true} url={leaderboardUrl} />

		<span class="name">{leaderboard?.song?.name} {leaderboard?.song?.subName}</span>
		<div class="author">{leaderboard?.song?.author} <small>{leaderboard?.song?.mapper}</small></div>
	</a>
{/if}

<style>
	a {
		display: grid;
		grid-template-areas:
			'cover name'
			'cover author';
		grid-template-columns: 5rem 1fr;
		align-items: center;
		color: var(--textColor) !important;
	}
	a :global(.cover-difficulty) {
		grid-area: cover;
	}
	.name {
		grid-area: name;
	}
	.author {
		grid-area: author;
		color: var(--alternate) !important;
	}
	.author small {
		font-size: 0.75em;
		color: var(--ppColour);
	}
</style>
