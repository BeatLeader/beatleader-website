<script>
	import CountryPicker from '../Common/CountryPicker.svelte';
	import {createEventDispatcher} from 'svelte';
	import {all_countries} from '../../utils/beatleader/format';

	export let countries = [];

	const dispatch = createEventDispatcher();

	const regionNames = new Intl.DisplayNames(['en'], {type: 'region'});

	function getCountryName(code) {
		try {
			if (!code?.length) throw 'Unknown';

			return code === 'not set' ? code : regionNames.of(code.toUpperCase());
		} catch (err) {
			return 'Unknown';
		}
	}

	const items = all_countries.map(code => ({value: code, label: getCountryName(code)})).sort((a, b) => a.label.localeCompare(b.label));
	function onSelect(e) {
		dispatch('change', e?.detail?.map(i => i.value)?.filter(v => v?.length) ?? []);
	}

	$: value = items.filter(i => (countries ?? []).includes(i.value));
</script>

<section
	style=" --clearSelectTop: 8px; --multiItemBG: var(--selected); --multiClearBG: var(--selected); --listBackground:
var(--background); --inputColor: var(--textColor); --multiSelectPadding: 2px 35px 2px 4px">
	<CountryPicker {value} {items} on:select={onSelect} />
</section>

<style>
	section {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem;
	}

	section :global(.badge-bg) {
		background: rgba(255, 255, 255, 0.123);
		border-bottom: 2px solid transparent;
		border-radius: 0.1rem;
		padding: 0.5rem;
		filter: saturate(0.5) brightness(1.4);
		transform: scale(0.8);
		font-weight: 400 !important;
		color: white !important;
		margin: 0 0;
	}
</style>
