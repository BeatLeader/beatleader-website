<script>
	import {fade} from 'svelte/transition';
	import {dateFromString} from '../../utils/date';
	import FormattedDate from '../Common/FormattedDate.svelte';

	export let videos = null;
</script>

{#if videos && videos.length}
	<section transition:fade>
		<h3 class="title is-6"><i class="fab fa-twitch" /> Twitch VODs</h3>

		<div class="videos">
			<span>Date</span>
			<span>Video</span>
			<span>Duration</span>

			{#each videos as video}
				<span><FormattedDate date={dateFromString(video.created_at)} /></span>

				<a href={video.url} target="_blank" rel="noreferrer">{video.title}</a>

				<span>{video.duration}</span>
			{/each}
		</div>
	</section>
{/if}

<style>
	section {
		width: 100%;
		padding: 0.5em;
		font-size: 0.875em;
	}

	h3 {
		padding: 0.25em;
		margin-bottom: 0.75em !important;
	}

	h3 i {
		margin-right: 0.25em;
		padding: 0.25em;
		color: white;
		background-color: #9146ff;
	}

	.videos {
		display: inline-grid;
		grid-template-columns: auto 1fr auto;
		grid-row-gap: 0.25em;
	}

	.videos :global(> *) {
		border-bottom: 1px solid var(--dimmed);
		padding: 0.125em 0.25em;
	}
</style>
