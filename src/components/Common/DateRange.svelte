<script>
	import {createEventDispatcher} from 'svelte';

	export let dateFrom = null;
	export let dateTo = null;
	export let type = 'datetime'; // 'datetime' or 'date'

	const dispatch = createEventDispatcher();

	function formatDate(date) {
		if (!date) return null;

		const d = new Date(date);
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		const hours = String(d.getHours()).padStart(2, '0');
		const minutes = String(d.getMinutes()).padStart(2, '0');

		if (type === 'datetime') {
			return `${year}-${month}-${day}T${hours}:${minutes}`;
		}
		return `${year}-${month}-${day}`;
	}

	function parseDate(dateString) {
		if (!dateString) return null;
		return new Date(dateString);
	}

	let initialized = false;

	function onChanged(localFrom, localTo) {
		if (!initialized) {
			initialized = true;
			return;
		}

		let newDateFrom = parseDate(localFrom);
		let newDateTo = parseDate(localTo);

		if (newDateFrom?.getTime() !== dateFrom?.getTime() || newDateTo?.getTime() !== dateTo?.getTime()) {
			dispatch('change', {from: newDateFrom, to: newDateTo});
		}
	}

	$: localFrom = formatDate(dateFrom);
	$: localTo = formatDate(dateTo);
	$: onChanged(localFrom, localTo);

	$: currentDate = formatDate(new Date());
</script>

<div class="date-range {type === 'datetime' ? 'datetime-local' : 'date'}">
	<input type={type === 'datetime' ? 'datetime-local' : 'date'} bind:value={localFrom} min="2022-01-01" max={localTo || currentDate} />
	to
	<input type={type === 'datetime' ? 'datetime-local' : 'date'} bind:value={localTo} min={localFrom || '2022-01-01'} max={currentDate} />
</div>

<style>
	.date-range {
		display: inline-flex;
		gap: 0.5em;
		align-items: center;
	}

	.date-range.datetime-local {
		align-items: start;
		flex-direction: column;
	}

	@media screen and (max-width: 500px) {
		.date-range {
			align-items: start;
			flex-direction: column;
		}
	}
</style>
