<script>
	import {createEventDispatcher, onMount, onDestroy} from 'svelte';

	import 'flatpickr/dist/flatpickr.min.css';
	import 'flatpickr/dist/themes/dark.css';

	export let dateFrom = null;
	export let dateTo = null;
	export let type = 'datetime';

	const dispatch = createEventDispatcher();

	const isFirefox = typeof navigator !== 'undefined' && /Firefox/i.test(navigator.userAgent);

	let fromEl;
	let toEl;
	let fromPicker;
	let toPicker;
	let initialized = false;

	function formatDate(date) {
		if (!date) return null;
		const d = new Date(date);
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		const hours = String(d.getHours()).padStart(2, '0');
		const minutes = String(d.getMinutes()).padStart(2, '0');
		if (type === 'datetime') return `${year}-${month}-${day}T${hours}:${minutes}`;
		return `${year}-${month}-${day}`;
	}

	function parseDate(dateString) {
		if (!dateString) return null;
		return new Date(dateString);
	}

	function onNativeChanged(localFrom, localTo) {
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

	$: if (!isFirefox) onNativeChanged(localFrom, localTo);

	$: currentDate = formatDate(new Date());

	function toDate(val) {
		if (!val) return undefined;
		return new Date(val);
	}

	function dispatchFlatpickrChange() {
		if (!initialized) return;
		const newFrom = fromPicker?.selectedDates?.[0] ?? null;
		const newTo = toPicker?.selectedDates?.[0] ?? null;
		if (newFrom?.getTime() !== dateFrom?.getTime() || newTo?.getTime() !== dateTo?.getTime()) {
			dispatch('change', {from: newFrom, to: newTo});
		}
	}

	function clearFrom() {
		fromPicker?.clear();
		toPicker?.set('minDate', '2022-01-01');
		dispatchFlatpickrChange();
	}

	function clearTo() {
		toPicker?.clear();
		fromPicker?.set('maxDate', new Date());
		dispatchFlatpickrChange();
	}

	$: enableTime = type === 'datetime';

	onMount(async () => {
		if (!isFirefox) {
			initialized = false;
			return;
		}

		const flatpickr = (await import('flatpickr')).default;

		const commonConfig = {
			enableTime,
			time_24hr: true,
			dateFormat: enableTime ? 'Y-m-d H:i' : 'Y-m-d',
			minDate: '2022-01-01',
			maxDate: new Date(),
			allowInput: true,
		};

		fromPicker = flatpickr(fromEl, {
			...commonConfig,
			defaultDate: toDate(dateFrom),
			onChange(selectedDates) {
				if (selectedDates[0]) toPicker?.set('minDate', selectedDates[0]);
				dispatchFlatpickrChange();
			},
		});

		toPicker = flatpickr(toEl, {
			...commonConfig,
			defaultDate: toDate(dateTo),
			onChange(selectedDates) {
				if (selectedDates[0]) fromPicker?.set('maxDate', selectedDates[0]);
				dispatchFlatpickrChange();
			},
		});

		if (dateFrom) toPicker.set('minDate', new Date(dateFrom));
		if (dateTo) fromPicker.set('maxDate', new Date(dateTo));

		initialized = true;
	});

	$: if (fromPicker && dateFrom !== undefined) {
		fromPicker.setDate(toDate(dateFrom), false);
	}
	$: if (toPicker && dateTo !== undefined) {
		toPicker.setDate(toDate(dateTo), false);
	}

	onDestroy(() => {
		fromPicker?.destroy();
		toPicker?.destroy();
	});
</script>

<div class="date-range {type === 'datetime' ? 'datetime-local' : 'date'}">
	{#if isFirefox}
		<span class="picker-wrap">
			<input bind:this={fromEl} placeholder="From" readonly />
			<button class="clear-btn" type="button" on:click={clearFrom} title="Clear">&times;</button>
		</span>
		<span>to</span>
		<span class="picker-wrap">
			<input bind:this={toEl} placeholder="To" readonly />
			<button class="clear-btn" type="button" on:click={clearTo} title="Clear">&times;</button>
		</span>
	{:else}
		<input type={type === 'datetime' ? 'datetime-local' : 'date'} bind:value={localFrom} min="2022-01-01" max={localTo || currentDate} />
		to
		<input type={type === 'datetime' ? 'datetime-local' : 'date'} bind:value={localTo} min={localFrom || '2022-01-01'} max={currentDate} />
	{/if}
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

	.date-range input {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 4px;
		color: inherit;
		padding: 0.3em 0.5em;
		font-size: inherit;
		cursor: pointer;
	}

	.date-range input:hover {
		border-color: rgba(255, 255, 255, 0.4);
	}

	.picker-wrap {
		display: inline-flex;
		align-items: center;
		position: relative;
	}

	.picker-wrap input {
		padding-right: 1.6em;
	}

	.clear-btn {
		position: absolute;
		right: 0.25em;
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.45);
		cursor: pointer;
		font-size: 1.1em;
		line-height: 1;
		padding: 0 0.2em;
	}

	.clear-btn:hover {
		color: rgba(255, 255, 255, 0.9);
	}

	@media screen and (max-width: 500px) {
		.date-range {
			align-items: start;
			flex-direction: column;
		}
	}
</style>
