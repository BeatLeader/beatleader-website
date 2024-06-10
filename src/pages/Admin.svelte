<script>
	import {navigate} from 'svelte-routing';
	import {createEventDispatcher} from 'svelte';
	import {fade, fly} from 'svelte/transition';
	import createAccountStore from '../stores/beatleader/account';
	import {debounce} from '../utils/debounce';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import Switcher from '../components/Common/Switcher.svelte';
	import AliasRequests from '../components/Admin/AliasRequests.svelte';
	import FailedScores from '../components/Admin/FailedScores.svelte';

	export let location;
	export let initialType;

	document.body.classList.remove('slim');

	let type;

	function getCurrentType(initialType) {
		type = initialType ?? 'failedScores';
		sortValue = sortValues.find(v => v.id == type);
	}

	let sortValues1 = [
		{id: 'failedScores', label: 'Failed scores', title: 'Sort by PP', iconFa: 'fa fa-file-excel'},
		{id: 'aliasRequests', label: 'Alias requests', title: 'Sort by accuracy clans with 3 players or more', iconFa: 'fa fa-user'},
		{id: 'countryRequests', label: 'Country requests', title: 'Sort by maps captured', iconFa: 'fa fa-flag'},
	];
	let sortValues = sortValues1;
	let sortValue = sortValues[0];

	function onSortChange(event) {
		type = event?.detail?.id;
	}

	$: getCurrentType(initialType);
</script>

<section class="align-content">
	<article class="page-content" transition:fade|global>
		<Switcher values={sortValues} value={sortValue} on:change={onSortChange} />
		<ContentBox>
			{#if type == 'failedScores'}
				<FailedScores />
			{:else if type == 'aliasRequests'}
				<AliasRequests />
			{/if}
		</ContentBox>
	</article>
</section>
