<script>
	import {createEventDispatcher} from 'svelte';
	import {DateTime} from 'luxon';

	export let date = null;

	const dispatch = createEventDispatcher();

	const USER_TIMEZONE = Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone ?? 'UTC';

	const getLocalDateFromJsDate = date => (date ? DateTime.fromJSDate(date).setZone(USER_TIMEZONE).toISODate() : null);

	let initialized = false;

	let local = getLocalDateFromJsDate(date);

	function onChanged(localFrom) {
		if (!initialized) {
			initialized = true;

			return;
		}

		let date = localFrom ? DateTime.fromISO(localFrom).toJSDate() : null;

		dispatch('change', date);
	}

	$: onChanged(local);
</script>

<input type="date" bind:value={local} min={'2022-01-01'} max={getLocalDateFromJsDate(new Date())} />

<style>
	.date-range {
		display: inline-flex;
		gap: 0.5em;
		align-items: center;
	}

	@media screen and (max-width: 500px) {
		.date-range {
			flex-direction: column;
		}
	}
</style>
