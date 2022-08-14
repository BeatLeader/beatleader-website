<script>
	import {fade} from 'svelte/transition';
	import {onMount} from 'svelte';
	import createAccountStore from '../stores/beatleader/account';
	import apiClient from '../network/clients/beatleader/leaderboard/api-leaderboards';
	import {copyToClipboard} from '../utils/clipboard';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import Error from '../components/Common/Error.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import QualificationStatus from '../components/Leaderboard/QualificationStatus.svelte';
	import Totals from '../components/Rt/Totals.svelte';
	import Switcher from '../components/Common/Switcher.svelte';
	import {
		buildSearchFromFilters,
		createBuildFiltersFromLocation,
		processIntArrayFilter,
		processStringArrayFilter,
		processStringFilter,
	} from '../utils/filters';
	import {navigate} from 'svelte-routing';
	import RangeSlider from 'svelte-range-slider-pips';

	export let location;

	document.body.classList.add('remove');

	const account = createAccountStore();

	const ITEMS_PER_PAGE = 100;
	const VOTED = 100; // max 100

	const sortValues = [
		{id: 'stars', label: 'Star', title: 'Sort by stars', iconFa: 'fa fa-star'},
		{id: 'name', label: 'Name', title: 'Sort by name', iconFa: 'fa fa-a'},
		{id: 'votescount', label: 'Votes count', title: 'Sort by votes count', iconFa: 'fas fa-calculator'},
		{id: 'votesrating', label: 'Votes rating', title: 'Sort by votes rating', iconFa: 'far fa-smile-beam'},
	];

	let sortValue = sortValues[0];

	const findParam = key => params.find(p => p.key === key);

	const onInputChange = (e, key) => {
		const param = findParam(key);
		if (param) {
			param.value = e.target.value ?? '';

			updateCurrentFiltersFromParams();
		}
	};

	const onSingleSwitchChange = (e, key) => {
		const param = findParam(key);
		if (param) {
			param.value = (param.values ?? []).find(p => p?.id === e?.detail?.id);

			updateCurrentFiltersFromParams();
		}
	};

	const onMultiSwitchChange = (e, key) => {
		const param = findParam(key);
		if (param) {
			param.value = (param?.value ?? []).includes(e.detail)
				? (param?.value ?? []).filter(p => p?.id !== e.detail.id)
				: [...(param?.value ?? []), e.detail];

			updateCurrentFiltersFromParams();
		}
	};

	let start = null;
	const rangeChange = (event, key) => {
		if (!Array.isArray(event?.detail?.values) || event.detail.values.length !== 2) return;

		const range = findParam(key);
		if (range) {
			range.values = event.detail.values;
		}

		start = new Date().getTime();
		setTimeout(() => {
			if (new Date().getTime() - start > 499) {
				updateCurrentFiltersFromParams(true);
			}
		}, 500);
	};

	const params = [
		{
			key: 'mine',
			label: 'Engagement',
			default: 'all',
			process: processStringFilter,
			type: 'switch',
			value: null,
			values: [
				{id: 'all', label: 'All maps'},
				{id: 'mine', label: 'Mine only'},
			],
			onChange: e => onSingleSwitchChange(e, 'mine'),
			multi: false,
		},
		{
			key: 'status',
			label: 'It has a status of',
			default: '',
			process: processStringArrayFilter,
			type: 'switch',
			value: [],
			values: [
				{id: 'nominated', label: 'Nominated'},
				{id: 'allowed', label: 'Mapper allowed'},
				{id: 'criteria', label: 'Criteria checked'},
				{id: 'approved', label: 'RT approved'},
				{id: 'voted', label: 'Has votes'},
			],
			onChange: e => onMultiSwitchChange(e, 'status'),
			multi: true,
		},
		{
			key: 'status_not',
			label: 'It has NOT a status of',
			default: '',
			process: processStringArrayFilter,
			type: 'switch',
			value: [],
			values: [
				{id: 'nominated', label: 'Nominated'},
				{id: 'allowed', label: 'Mapper allowed'},
				{id: 'criteria', label: 'Criteria checked'},
				{id: 'approved', label: 'RT approved'},
				{id: 'voted', label: 'Has votes'},
			],
			onChange: e => onMultiSwitchChange(e, 'status_not'),
			multi: true,
		},
		{
			key: 'mapper',
			label: 'Mapper',
			default: '',
			process: processStringFilter,
			type: 'input',
			value: '',
			placeholder: 'Search for a mapper',
			onChange: e => {
				const length = e?.target?.value?.length;
				if (length > 0 && length < 3) return;

				onInputChange(e, 'mapper');
			},
		},
		{
			key: 'name',
			label: 'Map Name',
			default: '',
			process: processStringFilter,
			type: 'input',
			value: '',
			placeholder: 'Search for a map',
			onChange: e => {
				const length = e?.target?.value?.length;
				if (length > 0 && length < 3) return;

				onInputChange(e, 'name');
			},
		},
		{
			key: 'star_range',
			label: 'Star range',
			default: [0, 20],
			min: 0,
			max: 20,
			step: 0.1,
			pipstep: 25,
			type: 'slider',
			process: processIntArrayFilter,
			values: [],
			onChange: e => rangeChange(e, 'star_range'),
		},
		{
			key: 'sortBy',
			default: 'stars',
			process: processStringFilter,
			type: null,
		},
		{
			key: 'order',
			default: 'desc',
			process: processStringFilter,
			type: null,
		},
	];

	const buildFiltersFromLocation = createBuildFiltersFromLocation(params, filters => {
		params.forEach(p => {
			if (p.key === 'star_range') {
				p.values = Array.isArray(filters?.[p.key]) && filters[p.key].length ? filters[p.key] : p?.default ?? [];
				filters[p.key] = filters[p.key] ?? 0;
			} else if (p.type === 'switch' && !p.multi) {
				filters[p.key] = (p?.values ?? [])?.map(v => v?.id)?.find(v => v === filters?.[p.key]) ?? p?.default ?? [];

				p.value = p?.values?.find(v => v.id === filters?.[p.key]) ?? null;
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

	function updateCurrentFiltersFromParams(noScroll) {
		params.forEach(p => {
			if (p.key === 'star_range') {
				currentFilters[p.key] = p?.values ?? [];
			} else if (p.type === 'switch' && !p.multi) {
				currentFilters[p.key] = p?.value?.id ?? '';
			} else {
				currentFilters[p.key] = p.multi ? (p?.value ?? [])?.map(p => p.id) : p?.value ?? '';
			}
		});

		params = params;

		navigateToCurrentPageAndFilters();
	}

	function navigateToCurrentPageAndFilters(replace) {
		navigate(`/rt?${buildSearchFromFilters(currentFilters)}`, {replace});
	}

	let currentFilters = buildFiltersFromLocation(location);

	let error = null;
	let isLoading = true;

	let songs = [];
	let detailsOpened = [];

	async function fetchAllMapsWithType(type) {
		let data = [];
		let page = 1;
		let count = ITEMS_PER_PAGE;
		let pageCount = null;

		while (!pageCount || page <= pageCount) {
			const pageData = await apiClient.getProcessed({page, filters: {type, count}});

			if (!pageData?.data?.length) return data;

			data = [...data, ...pageData.data.map(map => ({...map, type}))];

			if (!pageCount) {
				count = pageData?.metadata?.itemsPerPage ?? ITEMS_PER_PAGE;
				pageCount = pageData?.metadata?.total ? Math.ceil(pageData.metadata.total / count) : null;
			}

			page++;
		}

		return data;
	}

	async function fetchVotedMaps() {
		const data = await apiClient.getProcessed({page: 1, filters: {sortBy: 'votecount', count: VOTED}});

		return data?.data?.map(map => ({...map, type: 'voted'})) ?? [];
	}

	async function fetchMaps() {
		try {
			isLoading = true;
			error = null;

			songs = Object.values(
				(await Promise.all([fetchAllMapsWithType('nominated'), fetchAllMapsWithType('qualified'), fetchVotedMaps()]))
					.reduce((carry, maps) => [...carry, ...maps], [])
					.reduce((carry, map) => {
						const {difficulty, qualification, song, votes, ...rest} = map;

						if (song?.hash?.length && !carry[song.hash]) {
							carry[song.hash] = song;
						}

						const diffIdx = carry[song.hash]?.difficulties?.findIndex(d => d.id === difficulty.id);
						if (diffIdx >= 0) {
							const votesPositive = votes?.reduce((sum, v) => sum + (v?.rankability > 0 ? 1 : 0), 0) ?? 0;
							const votesNegative =
								votes?.reduce((sum, v) => sum + (Number.isFinite(v?.rankability) && v.rankability <= 0 ? 1 : 0), 0) ?? 0;

							const votesTotal = votes?.length ?? 0;
							const votesScore = votesTotal ? votesPositive / votesTotal : 0;
							const votesRating = votesScore - (votesScore - 0.5) * Math.pow(2, -Math.log10(votesTotal + 1));

							carry[song.hash].difficulties[diffIdx] = {
								...rest,
								...carry[song.hash].difficulties[diffIdx],
								qualification,
								leaderboardId: rest?.id,
								votes,
								votesPositive,
								votesNegative,
								votesRating,
								votesTotal,
							};
						}

						return carry;
					}, {})
			).map(s => {
				const totals = (s?.difficulties ?? []).reduce(
					(carry, diff) => {
						carry.nominated += !!diff?.qualification ? 1 : 0;
						carry.mapperAllowed += diff?.qualification?.mapperAllowed ? 1 : 0;
						carry.criteriaMet += diff?.qualification?.criteriaMet ? 1 : 0;
						carry.approved += diff?.qualification?.approved ? 1 : 0;
						carry.votesTotal += diff?.votes?.length ?? 0;
						carry.votesPositive += diff?.votesPositive ?? 0;
						carry.votesNegative += diff?.votesNegative ?? 0;

						['nominated', 'mapperAllowed', 'criteriaMet', 'approved'].forEach(key => {
							carry[`${key}Ratio`] = s?.difficulties?.length ? carry[key] / s.difficulties.length : 0;
						});

						const votesScore = carry.votesTotal ? carry.votesPositive / carry.votesTotal : 0;
						carry.votesRating = votesScore - (votesScore - 0.5) * Math.pow(2, -Math.log10(carry.votesTotal + 1));

						return carry;
					},
					{
						nominated: 0,
						nominatedRatio: 0,
						mapperAllowed: 0,
						mapperAllowedRatio: 0,
						criteriaMet: 0,
						criteriaMetRatio: 0,
						approved: 0,
						approvedRatio: 0,
						votesTotal: 0,
						votesPositive: 0,
						votesNegative: 0,
						votesRating: 0,
					}
				);

				return {...s, totals};
			});
		} catch (err) {
			error = err;
		} finally {
			isLoading = false;
		}
	}

	function toggleSongDetails(hash) {
		if (!hash?.length) return;

		if (detailsOpened.includes(hash)) detailsOpened = detailsOpened.filter(h => h !== hash);
		else detailsOpened = [...detailsOpened, hash];
	}

	function onSortChange(event) {
		if (!event?.detail?.id) return null;

		if (currentFilters.sortBy === event.detail.id) {
			currentFilters.order = currentFilters.order === 'asc' ? 'desc' : 'asc';
		} else {
			currentFilters.sortBy = event.detail.id;
			currentFilters.order = 'desc';
		}
		findParam('sortBy').value = currentFilters.sortBy;
		findParam('order').value = currentFilters.order;

		navigateToCurrentPageAndFilters();
	}

	$: isRT = $account?.player?.playerInfo?.role?.split(',')?.some(role => ['admin', 'rankedteam', 'creator'].includes(role));
	$: if (!$account?.loading && isRT) fetchMaps();
	$: if (!$account?.loading && !isRT) navigate('/');

	$: sortValue = sortValues.find(v => v.id === currentFilters.sortBy);

	$: console.log(songs);
	$: console.warn(currentFilters);
</script>

<svelte:head>
	<title>RT Dashboard</title>
</svelte:head>

<section class="align-content">
	<article class="page-content" transition:fade>
		<ContentBox>
			<h1 class="title is-3">RT Dashboard</h1>

			<section class="content">
				{#if error}
					<Error {error} />
				{:else if isLoading}
					<Spinner /> Loading...
				{:else if songs?.length}
					{#each songs as song (song.hash)}
						<div class="row">
							<div class="song">
								<img
									src={song.coverImage}
									alt="Cover"
									on:click={() => copyToClipboard(song.hash)}
									title={`Click to copy hash "${song.hash}"`} />

								<div class="songinfo">
									<span class="name">{song?.name} {song?.subName}</span>
									<div class="author">{song?.author} <small>{song?.mapper}</small></div>
								</div>

								<Totals totals={song.totals} count={song?.difficulties?.length} />

								<span
									class="reveal clickable"
									class:opened={detailsOpened.includes(song.hash)}
									on:click={() => toggleSongDetails(song.hash)}
									title="Show details">
									<i class="fas fa-chevron-down" />
								</span>
							</div>

							{#if detailsOpened.includes(song.hash)}
								{#each song.difficulties as difficulty (difficulty.id)}
									<div class="song-diff">
										<div class="diff-name">
											<a href="/leaderboard/global/{difficulty.leaderboardId}/1">
												{difficulty.difficultyName}
												{#if difficulty.stars}
													{difficulty.stars}<sup>★</sup>
												{:else}
													<span>No star rating yet</span>
												{/if}
											</a>

											<Totals totals={difficulty} />
										</div>

										{#if difficulty?.qualification}
											<div>
												<QualificationStatus qualification={difficulty?.qualification} />
											</div>
										{/if}
									</div>
								{/each}
							{/if}
						</div>
					{/each}
				{:else}
					No maps found.
				{/if}
			</section>
		</ContentBox>
	</article>

	<aside>
		<ContentBox>
			{#if !isLoading}
				<h2 class="title is-5">Sorting</h2>

				<Switcher values={sortValues} value={sortValue} on:change={onSortChange} />

				<h2 class="title is-5">Filtering</h2>
				{#each params as param}
					{#if param.type}
						<section class="filter">
							<label>{param?.label ?? param?.key ?? ''}</label>

							{#if param?.type === 'input'}
								<input type="text" placeholder={param.placeholder ?? null} value={param.value} on:input={param.onChange} />
							{:else if param?.type === 'switch'}
								<Switcher values={param.values} value={param.value} multi={!!param?.multi} on:change={param.onChange} />
							{:else if param?.type === 'slider'}
								<RangeSlider
									range
									min={param.min}
									max={param.max}
									step={param.step}
									values={param.values}
									float
									hoverable
									pips
									pipstep={param.pipstep}
									all="label"
									on:change={param.onChange} />
							{/if}
						</section>
					{/if}
				{/each}
			{:else}
				<Spinner /> Loading...
			{/if}
		</ContentBox>
	</aside>
</section>

<style>
	.align-content {
		display: flex;
		justify-content: flex-end !important;
	}

	.page-content {
		max-width: 65em;
		width: 100%;
	}

	article {
		width: calc(100% - 25em);
		overflow-x: hidden;
	}

	aside {
		width: 25em;
	}

	aside .filter {
		margin-bottom: 1.5rem;
		transition: opacity 300ms;
	}

	aside .filter.disabled {
		opacity: 0.25;
	}

	aside label {
		display: block;
		font-weight: 500;
		margin: 0.75rem 0;
	}

	aside .filter.disabled label {
		cursor: help;
	}

	aside label span {
		color: var(--beatleader-primary);
	}

	aside input {
		width: 100%;
		font-size: 1em;
		color: var(--beatleader-primary);
		background-color: var(--foreground);
		border: none;
		border-bottom: 1px solid var(--faded);
		outline: none;
	}

	aside :global(.switch-types) {
		justify-content: flex-start;
	}

	aside h2:not(:first-of-type) {
		margin-top: 1.5em;
	}

	aside :global(.rangeSlider.pip-labels) {
		margin-top: 1.5em;
		margin-bottom: 4em;
	}

	.row {
		border-bottom: 1px solid gray;
		padding: 0.5rem 0;
	}

	.song {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.songinfo {
		flex-grow: 1;
		text-align: left;
		font-size: 0.95rem;
		font-weight: 500;
	}

	.songinfo {
		color: var(--alternate);
	}

	.songinfo small {
		margin-left: 0.25em;
		font-size: 0.75em;
		color: var(--ppColour);
	}

	.song img {
		width: 3rem;
		height: 3rem;
	}

	.reveal {
		cursor: pointer;
		transition: transform 500ms;
		transform-origin: 0.42em 0.8em;
		margin-left: 0.5rem;
	}

	.reveal.opened {
		transform: rotateZ(180deg);
	}

	.song-diff {
		margin: 1rem 0;
	}

	.song-diff .diff-name {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.25rem;
	}

	.song-diff:last-child {
		margin-bottom: 0;
	}

	.song-diff > a {
		margin-bottom: 0.5rem;
	}

	@media screen and (max-width: 1275px) {
		.align-content {
			flex-direction: column-reverse;
			align-items: center;
		}

		aside {
			width: 100%;
			max-width: 65em;
		}
	}
</style>
