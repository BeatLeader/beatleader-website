<script>
	import {createEventDispatcher} from 'svelte';
	import {navigate} from 'svelte-routing';
	import {dateFromUnix, formatDate, formatDateRelative} from '../../utils/date';
	import Button from '../Common/Button.svelte';
	import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';

	let submissionsEndDate = 1738699200;
</script>

<section class="event">
	<img src="/assets/building-blocks-2024.png" />
	<h2>Building Blocks 2024</h2>
	<p class="description">A mapping contest with a prize pool and chance to get into ranked</p>

	<span style="color: white;" title={formatDate(dateFromUnix(submissionsEndDate))}>
		{#if Date.now() / 1000 < submissionsEndDate}
			Submissions end {formatDateRelative(dateFromUnix(submissionsEndDate))}
		{:else}
			Submissions are closed
		{/if}
	</span>
	<Button label="More info" />
</section>

<style>
	.event {
		display: flex;
		align-items: center;
		flex-direction: column;
		gap: 1em;
	}

	img {
		height: 200px;
	}

	h2 {
		font-weight: 500;
		font-size: 1.1em;
	}

	.description {
		width: 15em;
		text-align: center;
	}

	.metric {
		text-align: center;
	}

	.metric > label {
		display: block;
		margin-bottom: 0.125em;
		font-weight: 400;
	}

	.metric > span {
		display: block;
		color: var(--textColor);
		font-size: 1.2em;
		font-weight: 900;
	}
</style>
