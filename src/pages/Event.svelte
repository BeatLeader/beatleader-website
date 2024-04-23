<script>
	import {navigate} from 'svelte-routing';
	import {fade} from 'svelte/transition';
	import {scrollToTargetAdjusted} from '../utils/browser';
	import ssrConfig from '../ssr-config';
	import Spinner from '../components/Common/Spinner.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import {BL_API_URL} from '../network/queues/beatleader/api-queue';
	import RankingTable from '../components/Ranking/RankingTable.svelte';
	import Button from '../components/Common/Button.svelte';
	import createAccountStore from '../stores/beatleader/account';
	import {createBuildFiltersFromLocation, buildSearchFromFilters, processStringFilter, processStringArrayFilter} from '../utils/filters';
	import RangeSlider from 'svelte-range-slider-pips';
	import {debounce} from '../utils/debounce';
	import {dateFromUnix, formatDateRelative, formatDate, WEEKSECONDS} from '../utils/date';
	import Switcher from '../components/Common/Switcher.svelte';
	import Countries from '../components/Ranking/Countries.svelte';
	import Event from '../components/Event/Event.svelte';
	import {Confetti} from 'svelte-confetti';

	export let page = 1;
	export let location;
	export let eventId;

	const account = createAccountStore();

	const FILTERS_DEBOUNCE_MS = 500;

	const findParam = key => params.find(p => p.key === key);

	const onInputChange = (e, key) => {
		const param = findParam(key);
		if (param) {
			param.value = e.target.value ?? '';

			updateCurrentFiltersFromParams();
		}
	};

	var params = [
		{
			key: 'search',
			label: 'Player Name',
			default: '',
			process: processStringFilter,
			type: 'input',
			value: '',
			placeholder: 'Search for a player',
			onChange: e => {
				const length = e?.target?.value?.length;
				if (length > 0 && length < 3) return;

				onInputChange(e, 'search');
			},
		},
		{
			key: 'countries',
			label: 'Countries',
			default: [],
			process: processStringArrayFilter,
			type: 'countries',
			value: [],
			values: [],
			onChange: e => {
				const param = findParam('countries');
				if (param) {
					param.value = e?.detail ?? [];

					updateCurrentFiltersFromParams();
				}
			},
			multi: true,
		},
	];

	const buildFiltersFromLocation = createBuildFiltersFromLocation(params, filters => {
		params.forEach(p => {
			if (p.key === 'countries') {
				p.value = Array.isArray(filters?.[p.key]) ? filters[p.key] : p?.default ?? [];
				filters[p.key] = filters[p.key] ?? [];
			} else {
				filters[p.key] = p.multi
					? (p?.values ?? [])?.map(v => v?.id)?.filter(v => filters?.[p.key]?.includes(v)) ?? p?.default ?? []
					: filters?.[p.key]?.length
					? filters[p.key]
					: p?.default ?? '';

				p.value = p.multi
					? p?.values?.filter(v => filters?.[p.key]?.includes(v.id)) ?? p?.default ?? []
					: filters?.[p.key] ?? p?.default ?? '';
			}
		});

		return filters;
	});

	document.body.classList.add('slim');

	if (page && !Number.isFinite(page)) page = parseInt(page, 10);
	if (!page || isNaN(page) || page <= 0) page = 1;

	let currentPage = page;
	let currentFilters = buildFiltersFromLocation(location);
	let currentEventId = eventId;
	let currentEvent;
	let boxEl = null;

	let isLoading = false;
	let pending = null;
	let preventScroll = false;

	function updateCurrentFiltersFromParams(noScroll) {
		params.forEach(p => {
			if (p.key === 'countries') {
				currentFilters[p.key] = p.multi ? (p?.value ?? []).join(',') : p?.value ?? '';
			} else {
				currentFilters[p.key] = p.multi ? (p?.value ?? [])?.map(p => p.id)?.join(',') : p?.value ?? '';
			}
		});

		params = params;

		currentPage = 1;
		preventScroll = noScroll;

		navigateToCurrentPageAndFilters();
	}

	function changeParams(newPage, eventId, newLocation, replace) {
		currentEventId = eventId;
		newPage = parseInt(newPage, 10);
		if (isNaN(newPage)) newPage = 1;

		currentFilters = buildFiltersFromLocation(newLocation);
		if (!currentFilters?.sortBy?.length) {
			currentFilters.sortBy = 'pp';
		}

		currentPage = newPage;

		if (!currentEvent) {
			fetch(BL_API_URL + 'event/' + eventId)
				.then(response => response.json())
				.then(ev => {
					currentEvent = ev;
				});
		}
	}

	function onPageChanged(event) {
		if (event?.detail?.initial || !Number.isFinite(event.detail.page)) return;

		navigate(`/event/${currentEventId}/${event.detail.page + 1}?${buildSearchFromFilters(currentFilters)}`, {preserveScroll: true});
	}

	function navigateToCurrentPageAndFilters(replace) {
		navigate(`/event/${currentEventId}/${currentPage}?${buildSearchFromFilters(currentFilters)}`, {replace, preserveScroll: true});
	}

	let topPlayerId;
	function onPlayersFetched(event) {
		if (event.detail && event.detail.length) {
			topPlayerId = event.detail[0].playerId;
		}
	}

	let modalShown;

	$: document.body.scrollIntoView({behavior: 'smooth'});
	$: changeParams(page, eventId, location, true);
	$: mainPlayerId = $account?.id;
</script>

<svelte:head>
	<title>Event / {currentPage} - {ssrConfig.name}</title>
</svelte:head>

<section class="align-content">
	<aside>
		<ContentBox cls={eventId == 23 ? 'festive' : ''}>
			<Event event={currentEvent} withLeader={false} on:show-playlist={e => navigate('/playlist/' + e?.detail?.playlistId)} />
		</ContentBox>
	</aside>

	<article class="page-content" transition:fade|global>
		{#if eventId == 23}
			<ContentBox cls={modalShown ? 'inner-modal' : ''}>
				<span>
					Have you ever wondered how Beat Saber would feel with timing based scoring instead of accuracy based? Wonder no more!<br />
					Limited time offer from BeatLeader. Install the mods and play custom mode to try our attempt at reimagining the game.<br />
					No preswing, postswing or accuracy, only you and cubes. <br /><br />
				</span>
				<div class="downloadButtons">
					<a href="https://github.com/BeatLeader/beatleader-modifiers-mod/releases" target="_blank" rel="noreferrer">
						<Button iconFa="fas fa-download" label="Download PC mod" color="#2d4150" />
					</a>
					<a href="https://github.com/BeatLeader/beatleader-modifiers-qmod/releases" target="_blank" rel="noreferrer">
						<Button iconFa="fas fa-download" label="Download Quest mod" color="#2d4150" />
					</a>
				</div>
				<span>
					<br />
					Event consists of 10 Christmas themed songs and 10 most voted ranked maps.<br />
					Thank you mappers and ranking team for the productive year<br />
					<b>Happy holidays and have fun!</b>
				</span>
			</ContentBox>
		{/if}
		{#if eventId == 31}
			<ContentBox cls={modalShown ? 'inner-modal' : ''}>
				<b
					>This event used completely separate leaderboards to allow players to set new scores. These leaderboards are gone now. Players
					ranking kept for historical purpose here.<br /></b>
			</ContentBox>
		{/if}
		{#if eventId == 32 || eventId == 48}
			<ContentBox cls={modalShown ? 'inner-modal' : ''}>
				<b>Score Recycling Initiative<br /></b>
				<span>
					Players were improving their scores to cut down wasted space and make PP growth sustainable<br />
				</span>
			</ContentBox>
		{/if}
		{#if eventId == 34}
			<ContentBox cls={modalShown ? 'inner-modal' : ''}>
				<span>
					<b>Beat Saber turned 5! Happy Birthday and thank you for megaton of Dopamine generated!</b><br />
					Check out and compete on maps made by awesome mappers for
					<a href="https://beatsaver.com/playlists/84243" target="_blank" rel="noreferrer">[2018 THROWBACK]</a>
					and <a href="https://beatsaver.com/playlists/89418" target="_blank" rel="noreferrer">BSMG anniversary</a>. <br />
					Top 5 will receive merch from BSMG store as a prize!. <br />
					Skill issue? Don't worry, you can buy it yourself <a href="https://bsmgstore.com/" target="_blank" rel="noreferrer">here</a>
					<br />
					Support modders who are providing you with an exceptional experience for 5 years <br /><br />
				</span>
				Check out also festive sabers and mod in the mod assistant
				<div class="downloadButtons">
					<a href="https://modelsaber.com/Sabers/?id=1682920308" target="_blank" rel="noreferrer">
						<Button iconFa="fas fa-download" label="Download PC sabers" color="red" />
					</a>
					<a href="https://bsmg.dev/5thAnniWhacker" target="_blank" rel="noreferrer">
						<Button iconFa="fas fa-download" label="Download Quest sabers" color="blue" />
					</a>
				</div>
				<span>
					Or try our small "festive" theme <a href="/settings#theme" target="_blank" rel="noreferrer"> in settings</a>. <br />
				</span>
				<span>
					<br />
					<b>Happy weekends and have fun!</b>
				</span>
			</ContentBox>
		{/if}
		{#if eventId == 38}
			<ContentBox cls={modalShown ? 'inner-modal' : ''}>
				<span>
					<b>Bats? Ghosts? Pumpkins? It's Halloween again? 😱 </b><br />
					Have you ever competed with Ghost Notes modifier? It's time to try! We picked several maps from the awesome
					<a href="https://bsaber.com/scaretastic-pack/" target="_blank" rel="noreferrer">Scaretastic Pack</a>
					and from the <a href="https://beatsaver.com/playlists/203171">BSMG Halloween contest</a>. <br /><br />
					<b>Try your best with Ghost Notes on separate leaderboards to receive merch from BSMG store as a prize for top 5!.</b> <br />
					Skill issue? Don't worry, you can buy it yourself <a href="https://bsmgstore.com/" target="_blank" rel="noreferrer">here</a>
					<br />
					Huge thanks to modders and mappers who always provide us with festive content 🙏 <br /><br />
				</span>
				<span>
					<br />
					<b>Have a scary weekend and holiday, many sweets and fun!</b>
				</span>
			</ContentBox>
		{/if}
		{#if eventId == 46}
			<ContentBox cls={modalShown ? 'inner-modal' : ''}>
				<span>
					Compete on 50 original maps for Beat Saber spanned across 8 packs and almost 6 years!<br />

					Let's remember what journey the game had and how your and mappers skill improved with time. <br />

					<b>Top 10 will receive badges and top 5 various merch presents.</b><br />
					All free difficulties and modes are included except "No Arrows" mode.<br /><br />
				</span>
				For the best OST support - update to the latest mod versions if you haven't yet:
				<div class="downloadButtons">
					<a href="https://github.com/BeatLeader/beatleader-mod/releases/tag/v0.9.8" target="_blank" rel="noreferrer">
						<Button iconFa="fas fa-download" label="Download for PC" color="red" />
					</a>
					<a href="https://github.com/BeatLeader/beatleader-qmod/releases/tag/v0.7.1" target="_blank" rel="noreferrer">
						<Button iconFa="fas fa-download" label="Download for Quest" color="blue" />
					</a>
				</div>
				<span>
					<br />
					<b>Good luck and have fun!</b>
				</span>
			</ContentBox>
		{/if}
		<ContentBox cls={modalShown ? 'inner-modal' : ''}>
			{#each params as param}
				{#if param.type}
					<section class="filter">
						<label>{param?.label ?? param?.key ?? ''}</label>

						{#if param?.type === 'input'}
							<input
								type="text"
								placeholder={param.placeholder ?? null}
								value={param.value}
								on:input={debounce(param.onChange, FILTERS_DEBOUNCE_MS)} />
						{:else if param?.type === 'countries'}
							<Countries countries={param.value} on:change={param.onChange} on:open={e => (modalShown = e.detail)} />
						{/if}
					</section>
				{/if}
			{/each}
		</ContentBox>
		<ContentBox bind:box={boxEl}>
			<h1 class="title is-5">
				Ranking

				{#if isLoading}
					<Spinner />
				{/if}
			</h1>

			<RankingTable
				page={currentPage}
				filters={currentFilters}
				playerClickFilter={`eventId=${currentEvent?.id ?? ''}`}
				eventId={currentEventId}
				on:players-fetched={onPlayersFetched}
				on:page-changed={onPageChanged}
				on:loading={e => (isLoading = !!e?.detail)}
				on:pending={e => (pending = e?.detail)} />
		</ContentBox>
	</article>

	{#if mainPlayerId && topPlayerId && mainPlayerId == topPlayerId && currentEvent && Date.now() / 1000 < currentEvent.endDate + WEEKSECONDS}
		<div class="confetti">
			<Confetti x={[-5, 5]} y={[0, 0.1]} delay={[500, 2000]} size="20" infinite duration="5000" amount="200" fallDistance="100vh" />
		</div>
	{/if}
</section>

<style>
	.align-content {
		display: flex;
		justify-content: flex-start;
	}

	.page-content {
		max-width: 65em;
		width: 100%;
	}

	aside {
		width: 25em;
	}

	aside :global(.switch-types) {
		justify-content: flex-start;
	}

	.confetti {
		position: fixed;
		top: -50px;
		left: 0;
		height: 100vh;
		width: 100vw;
		display: flex;
		justify-content: center;
		overflow: hidden;
		pointer-events: none;
	}

	:global(.inner-modal) {
		z-index: 10;
		position: relative;
	}

	@media screen and (max-width: 1275px) {
		.align-content {
			flex-direction: column;
			align-items: center;
		}

		aside {
			width: 100%;
			max-width: 65em;
		}
	}
</style>
