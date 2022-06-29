<script>
	import {createEventDispatcher, onMount} from 'svelte';
	import {fly} from 'svelte/transition';
	import createAccountStore from '../../stores/beatleader/account';
	import createRankingStore from '../../stores/http/http-ranking-store';
	import {PLAYERS_PER_PAGE} from '../../utils/beatleader/consts';
	import Pager from '../Common/Pager.svelte';
	import PlayerCard from './PlayerCard.svelte';
	import AddFriendButton from '../Player/AddFriendButton.svelte';
	import Filter from '../Common/Filter.svelte';
	import {identity} from 'svelte/internal';

	export let type = 'global';
	export let page = 1;
	export let filters = {};
	export let noIcons = false;

	const dispatch = createEventDispatcher();

	const account = createAccountStore();

	if (page && !Number.isFinite(page)) page = parseInt(page, 10);
	if (!page || isNaN(page) || page <= 0) page = 1;

	let boxEl = null;

	const rankingStore = createRankingStore(type, page, filters);

	
	     
	function getRegions(){
		const items = ['ad', 'ae', 'af', 'ag', 'ai', 'al', 'am', 'ao', 'aq', 'ar', 'as', 'at', 'au', 'aw', 'ax', 'az', 'ba', 'bb', 'bd', 'be', 'bf', 'bg', 'bh', 'bi', 'bj', 'bl', 'bm', 'bn', 'bo', 'bq', 'br', 'bs', 'bt', 'bv', 'bw', 'by', 'bz', 'ca', 'cc', 'cd', 'cf', 'cg', 'ch', 'ci', 'ck', 'cl', 'cm',  'co', 'cr', 'cu', 'cv', 'cw', 'cx', 'cy', 'cz', 'de', 'dj', 'dk', 'dm', 'do', 'dz', 'ec', 'ee', 'eg', 'eh', 'er', 'es', 'et', 'fi', 'fj', 'fk', 'fm', 'fo', 'fr', 'ga', 'gb', 'gd', 'ge', 'gf', 'gg', 'gh', 'gi', 'gl', 'gm', 'gn', 'gp', 'gq', 'gr', 'gs', 'gt', 'gu', 'gw', 'gy', 'hm', 'hn', 'hr', 'ht', 'hu', 'id', 'ie', 'il', 'im', 'in', 'io', 'iq', 'ir', 'is', 'it', 'je', 'jm', 'jo', 'jp', 'ke', 'kg', 'kh', 'ki', 'km', 'kn', 'kp', 'kr', 'kw', 'ky', 'kz', 'la', 'lb', 'lc', 'li', 'lk', 'lr', 'ls', 'lt', 'lu', 'lv', 'ly', 'ma', 'mc', 'md', 'me', 'mf', 'mg', 'mh', 'mk', 'ml', 'mm', 'mn', 'mp', 'mq', 'mr', 'ms', 'mt', 'mu', 'mv', 'mw', 'mx', 'my', 'mz', 'na', 'nc', 'ne', 'nf', 'ng', 'ni', 'nl', 'no', 'np', 'nr', 'nu', 'nz', 'om', 'pa', 'pe', 'pf', 'pg', 'ph', 'pk', 'pl', 'pm', 'pn', 'pr', 'ps', 'pt', 'pw', 'py', 'qa', 're', 'ro', 'rs', 'ru', 'rw', 'sa', 'sb', 'sc', 'sd', 'se', 'sg', 'sh', 'si', 'sj', 'sk', 'sl', 'sm', 'sn', 'so', 'sr', 'ss', 'st', 'sv', 'sx', 'sy', 'sz', 'tc', 'td', 'tf', 'tg', 'th', 'tj', 'tk', 'tl', 'tm', 'tn', 'to', 'tr', 'tt', 'tv',  'tz', 'ua', 'ug', 'um', 'us', 'uy', 'uz', 'va', 'vc', 've', 'vg', 'vi', 'vn', 'vu', 'wf', 'ws', 'xk', 'ye', 'yt', 'za', 'zm', 'zw'];

    	let generated={}
    	for(let countryCode of items){
   		   generated[countryCode]=new Intl.DisplayNames(['en'], {type: 'region'}).of(countryCode.toUpperCase())
    	}

		return {
			"global":"Global",...generated,
			"cn":"China Mainland",
			"hk":"Hong Kong, China",
			"tw":"Tai Wan, China",
			"mo":"Macau, China"
		};
	}
	const countryChoices=getRegions();

	function changeParams(newType, newPage, newFilters) {
		newPage = parseInt(newPage, 10);
		if (isNaN(newPage)) newPage = 1;

		rankingStore.fetch(newType, newPage, {...newFilters}, true);
	}

	onMount(() => {
		dispatch('loading', true);
	});

	$: isLoading = rankingStore.isLoading;
	$: pending = rankingStore.pending;
	$: numOfPlayers = $rankingStore ? $rankingStore.total : null;
	$: mainPlayerId = $account?.id;

	$: changeParams(type, page, filters);
	$: dispatch('loading', $isLoading);
	$: dispatch('pending', $pending?.page);
</script>
<Filter
		filters={[
			{
				name: 'Sort By',
				type: 'radio',
				choices: {
					pp: 'PP',
					rank: 'Rank',
					acc: 'Acc',
					topAcc: 'Top Acc',
					topPp: 'Top PP',
					hmd: 'HMD',
					playCount: 'Play Count',
					score: 'Total Score',
					dailyImprovements: 'Daily Improvements',
				},
				once: true,
				identifier: 'sortBy',
				default: 'pp',
			},
			{
				name: 'Order',
				type: 'radio',
				choices: {
					desc: 'Descending ↓',
					asc: 'Ascending ↑',
				},
				once: true,
				identifier: 'order',
				default: 'desc',
			},
			{
				name: 'Search',
				type: 'text',
				identifier: 'search',
				once: true,
			},
			{
				name: 'Is Friend',
				type: 'bool',
				identifier: 'friend',
				once: true,
			},
			{
				name: 'Platform',
				identifier: 'platform',
				type: 'radio',
				choices: {
					steam: 'Steam',
					oculus: 'Oculus Android',
					oculuspc: 'Oculus PC',
				},
				once: true,
			},
			{
				name: 'Role',
				identifier: 'role',
				type: 'radio',
				choices: {
					admin: 'Administrator',
					rankedteam: 'Ranked Team',
					tipper: 'Tipper',
					supporter: 'Supporter',
					sponsor: 'Sponsor',
				},
				once: true,
			},
			{
				name: 'Country/Region',
				identifier: 'countries',
				type: 'radio',
				choices: countryChoices,
			}
		]}
		onFilterChange={result => {
			changeParams(type, page, {filter: result.toUrl(), ...filters});
		}} />
{#if $rankingStore?.data?.length}
	
	<section class="ranking-grid">
		{#each $rankingStore.data as player, idx (player?.playerId)}
			<div class="ranking-grid-row" in:fly={{delay: idx * 10, x: 100}}>
				<PlayerCard {player} playerId={mainPlayerId} currentFilters={filters} />
				{#if !noIcons}
					<AddFriendButton playerId={player.playerId} />
				{/if}
			</div>
		{/each}
	</section>

	<Pager
		totalItems={numOfPlayers}
		itemsPerPage={PLAYERS_PER_PAGE}
		itemsPerPageValues={null}
		currentPage={page - 1}
		loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
		mode={numOfPlayers ? 'pages' : 'simple'}
		on:page-changed />
{:else if !$isLoading}
	<p>No players found.</p>
{/if}

<style>
	.ranking-grid {
		display: grid;
		grid-gap: 0.75em;
	}

	.ranking-grid-row {
		display: grid;
		grid-template-columns: auto 2.4em;
		grid-gap: 0.4em;
		align-items: center;
		justify-items: center;
	}

	.icon {
		display: flex;
		width: 9.5em;
		height: 2.5em;
		color: white;
		border-radius: 0.4em;
		margin-bottom: 1em;
	}

	.icon.off {
		color: #ffffffe1;
	}

	.icon.pp {
		background: var(--faded);
	}

	.icon.pp:hover {
		background: var(--faded) linear-gradient(0deg, transparent, #ffffff66);
	}

	.icon.dailyImprovements {
		background: green;
		cursor: pointer;
	}

	.icon.dailyImprovements:hover {
		background: green linear-gradient(0deg, transparent, #ffffff66);
	}

	.sortBy {
		margin-left: 0.5em;
		font-weight: normal;
		font-family: BlinkMacSystemFont, -apple-system, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
			'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
	}

	@media screen and (max-width: 500px) {
		.ranking-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
