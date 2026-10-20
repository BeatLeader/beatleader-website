<script>
	import TabSwitcher from '../Common/TabSwitcher.svelte';

	export let tabs;
	export let selected;
	export let onSelect;

	$: values = tabs.map(tab => ({...tab, cls: 'service-tab-button'}));
	$: value = values.find(tab => tab.id === selected);
</script>

<div class="service-switcher pinned-tabs">
	<TabSwitcher {values} {value} on:change={e => onSelect(e.detail.id)} />
</div>

<style>
	.pinned-tabs {
		margin-top: -2em;
		margin-bottom: 1.3em;
		margin-left: -1em;
	}

	@media screen and (max-width: 500px) {
		.pinned-tabs {
			margin-top: -3.3em;
		}
	}
</style>
