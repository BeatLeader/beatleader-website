<script>
	import {createEventDispatcher} from 'svelte';
	import { DateTime } from 'luxon';

	export let dateFrom = null;
	export let dateTo = null;

	const dispatch = createEventDispatcher();

	const USER_TIMEZONE = Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone ?? 'UTC';

	const getLocalDateFromJsDate = date => date ? DateTime.fromJSDate(date).setZone(USER_TIMEZONE).toISODate() : null;

	let initialized = false;

	let localFrom = getLocalDateFromJsDate(dateFrom)
	let localTo = getLocalDateFromJsDate(dateTo)

	function onChanged(localFrom, localTo) {
		if (!initialized) {
			initialized = true;

			return;
		}

		let dateFrom = localFrom ? DateTime.fromISO(localFrom).toJSDate() : null;
		let dateTo = localTo ? DateTime.fromISO(localTo).toJSDate() : null;

		dispatch('change', {from: dateFrom, to: dateTo});
	}

	$: onChanged(localFrom, localTo)
</script>

<div class="date-range">
	<input type="date" bind:value={localFrom}
				 min="2022-01-01" max={localTo ? localTo : getLocalDateFromJsDate(new Date())}
	/>
	to
	<input type="date" bind:value={localTo}
				 min={localFrom ? localFrom : '2022-01-01'} max={getLocalDateFromJsDate(new Date())}
	/>
</div>

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
