<script>
	import {BL_API_URL} from '../network/queues/beatleader/api-queue';
	import PlaylistEventPage from '../components/Event/PlaylistEventPage.svelte';
	import MOTDEventPage from '../components/Event/MOTDEventPage.svelte';

	export let page = 1;
	export let location;
	export let eventId;

	let currentEvent = null;

	function loadEvent(eventId) {
		if (!currentEvent) {
			fetch(BL_API_URL + 'event/' + eventId)
				.then(response => response.json())
				.then(ev => {
					currentEvent = ev;
				});
		}
	}

	$: loadEvent(eventId);
</script>

{#if currentEvent}
	{#if currentEvent.eventType === 0}
		<PlaylistEventPage {currentEvent} {page} {location} eventId={currentEvent.id} />
	{:else if currentEvent.eventType === 1}
		<MOTDEventPage {currentEvent} {page} {location} eventId={currentEvent.id} />
	{/if}
{/if}
