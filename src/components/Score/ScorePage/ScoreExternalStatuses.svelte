<script>
	import {dateFromUnix, formatDate} from '../../../utils/date';

	export let statuses;
</script>

{#each statuses as status}
	{#if status.status == 2}
		<div class="score-of-the-week">
			<h1 class="title-container">Score Of The Week</h1>
			<div class="iframe-container" style="display: flex; justify-content: center;">
				<iframe
					width="100%"
					style="aspect-ratio: 16/9;"
					src={`https://www.youtube-nocookie.com/embed/${status.link.replace('https://youtu.be/', '')}?si=b4lLpGGYeIZ8kRb8`}
					title="YouTube video player"
					frameborder="0"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
					allowfullscreen />
			</div>
			<span class="date-container">{formatDate(dateFromUnix(status.timestamp), 'long', null)}</span>
		</div>
	{/if}
{/each}

<style>
	.score-of-the-week {
		padding: 0.5em;
		background-color: #8000b975;
		border-radius: 14px;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
	}
	.title-container {
		font-weight: bold;
	}
	.iframe-container {
		width: 23em;
		height: 12em;
		border-radius: 14px;
		overflow: hidden;
	}
	.date-container {
		color: azure;
	}
</style>
