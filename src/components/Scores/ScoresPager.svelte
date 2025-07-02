<script>
	import {PLAYER_SCORES_PER_PAGE} from '../../utils/beatleader/consts';
	import {PLAYER_SCORES_PER_PAGE as ACCSABER_PLAYER_SCORES_PER_PAGE} from '../../utils/accsaber/consts';
	import Pager from '../Common/Pager.svelte';

	export let playerId = null;
	export let service = null;
	export let serviceParams = null;
	export let totalItems = null;
	export let currentPage = 0;
	export let loadingPage = null;
	export let fixedItemsPerPage = null;

	$: itemsPerPage = fixedItemsPerPage
		? fixedItemsPerPage
		: service === 'accsaber'
			? ACCSABER_PLAYER_SCORES_PER_PAGE
			: PLAYER_SCORES_PER_PAGE;
</script>

<Pager
	{totalItems}
	{itemsPerPage}
	itemsPerPageValues={null}
	{currentPage}
	{loadingPage}
	mode={totalItems ? 'pages' : 'simple'}
	on:page-changed />

<style>
	.scores-date-browse {
		margin-top: 1rem;
		width: 100%;
		height: 100px;
	}

	.histogram-controls {
		display: flex;
		justify-content: flex-end;
		align-items: center;
	}

	.range {
		display: inline-flex;
	}

	.range > *:not(:last-child) {
		margin-right: 0.5em;
	}

	.range i.fa {
		cursor: pointer;
		padding-top: 0.25em;
	}
</style>
