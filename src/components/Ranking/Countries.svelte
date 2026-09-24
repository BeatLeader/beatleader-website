<script>
	import CountryPicker from '../Common/CountryPicker.svelte';
	import PickerBlock from '../Common/PickerBlock.svelte';
	import {createEventDispatcher} from 'svelte';
	import {all_countries} from '../../utils/beatleader/format';

	export let countries = [];
	export let placeholder;
	export let icon = null;

	const dispatch = createEventDispatcher();

	const regionNames = new Intl.DisplayNames(['en'], {type: 'region'});

	let listOpen = false;

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

	function onOpen(e) {
		listOpen = !!e?.detail;
		dispatch('open', e?.detail);
	}

	$: value = items.filter(i => (countries ?? []).includes(i.value));
</script>

<PickerBlock {icon} hasValue={!!countries?.length} open={listOpen}>
	<CountryPicker
		value={value.length ? value : null}
		{items}
		{placeholder}
		placeholderAlwaysShow={false}
		on:select={onSelect}
		on:open={onOpen} />
</PickerBlock>
