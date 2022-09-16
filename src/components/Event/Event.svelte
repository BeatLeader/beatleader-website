<script>
	import {createEventDispatcher} from 'svelte';
	import {dateFromUnix, formatDate, formatDateRelative} from '../../utils/date';
	import Button from '../Common/Button.svelte';

	export let event;

	const dispatch = createEventDispatcher();
</script>

{#if event}
	<section class="event">
		<img src={event.image} />
		<h2>{event.name}</h2>
		<span style="color: white;" title={formatDate(dateFromUnix(event.endDate))}>
			{#if Date.now() / 1000 < event.endDate}
				Will end {formatDateRelative(dateFromUnix(event.endDate))}
			{:else}
				Ended {formatDateRelative(dateFromUnix(event.endDate))}
			{/if}
		</span>
		<Button label="Show playlist" on:click={() => dispatch('show-playlist', event)} />
	</section>
{/if}

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
</style>
