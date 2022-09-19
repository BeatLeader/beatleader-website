<script>
	import {tick} from 'svelte';
	import {navigate} from 'svelte-routing';
	import {fade, fly} from 'svelte/transition';
	import createLeaderboardsStore from '../stores/http/http-leaderboards-store';
	import createAccountStore from '../stores/beatleader/account';
	import createPlaylistStore from '../stores/playlists';
	import {scrollToTargetAdjusted} from '../utils/browser';
	import ssrConfig from '../ssr-config';
	import Pager from '../components/Common/Pager.svelte';
	import Spinner from '../components/Common/Spinner.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';
	import Icons from '../components/Song/Icons.svelte';
	import SongCover from '../components/Player/SongCover.svelte';
	import RangeSlider from 'svelte-range-slider-pips';
	import {debounce} from '../utils/debounce';
	import {formatNumber} from '../utils/format';
	import Switcher from '../components/Common/Switcher.svelte';
	import {
		createBuildFiltersFromLocation,
		buildSearchFromFilters,
		processFloatFilter,
		processStringFilter,
		processIntFilter,
		processBoolFilter,
	} from '../utils/filters';
	import SongScore from '../components/Player/SongScore.svelte';
	import {processScore} from '../network/clients/beatleader/scores/utils/processScore';
	import QualificationStatusSmall from '../components/Leaderboard/QualificationStatusSmall.svelte';
	import Button from '../components/Common/Button.svelte';
	import DateRange from '../components/Common/DateRange.svelte';
	import {dateFromUnix, DAY} from '../utils/date';
	import {typesDescription, typesMap, DifficultyStatus, formatDiffApproval, formatDiffApprovalColor} from '../utils/beatleader/format';
	import {capitalize} from '../utils/js';
	import RankedTimer from '../components/Others/RankedTimer.svelte';
	import ReweightStatusSmall from '../components/Leaderboard/ReweightStatusSmall.svelte';

	export let page = 1;
	export let location;

	const MIN_STARS = 0;
	const MAX_STARS = 15;
	const FILTERS_DEBOUNCE_MS = 500;

	document.body.classList.remove('slim');

	const account = createAccountStore();

	const playlists = createPlaylistStore();

	const params = [
		{key: 'search', default: '', process: processStringFilter},
		{key: 'type', default: '', process: processStringFilter},
		{key: 'mytype', default: '', process: processStringFilter},
		{key: 'stars_from', default: MIN_STARS, process: processFloatFilter},
		{key: 'stars_to', default: MAX_STARS, process: processFloatFilter},
		{key: 'date_from', default: null, process: processIntFilter},
		{key: 'date_to', default: null, process: processIntFilter},
		{key: 'sortBy', default: 'voting', process: processStringFilter},
		{key: 'order', default: 'asc', process: processStringFilter},
		{key: 'mapType', default: null, process: processIntFilter},
		{key: 'allTypes', default: false, process: processBoolFilter},
	];

	const buildFiltersFromLocation = createBuildFiltersFromLocation(params, filters => {
		if (filters.stars_from > filters.stars_to) {
			const tmp = filters.stars_from;
			filters.stars_from = filters.stars_to;
			filters.stars_to = tmp;
		}

		if (!filters?.sortBy?.length) filters.sortBy = 'stars';
		if (!filters?.order?.length) filters.order = 'desc';
		if (!filters?.type?.length) filters.type = 'ranked';

		if (!filters.mapType) filters.mapType = null;

		return filters;
	});

	if (page && !Number.isFinite(page)) page = parseInt(page, 10);
	if (!page || isNaN(page) || page <= 0) page = 1;

	let currentPage = page;
	let currentFilters = buildFiltersFromLocation(location);
	let boxEl = null;
	let searchInputEl = null;

	const typeFilterOptions = [
		{key: 'all', label: 'All maps', iconFa: 'fa fa-music', color: 'var(--beatleader-primary)'},
		{key: 'nominated', label: 'Nominated', iconFa: 'fa fa-rocket', color: 'var(--beatleader-primary)'},
		{key: 'qualified', label: 'Qualified', iconFa: 'fa fa-check', color: 'var(--beatleader-primary)'},
		{key: 'ranked', label: 'Ranked', iconFa: 'fa fa-cubes', color: 'var(--beatleader-primary)'},
		{key: 'reweighting', label: 'Ranked, reweighting', iconFa: 'fa fa-cubes', color: 'var(--beatleader-primary)'},
		{key: 'reweighted', label: 'Ranked, reweighted', iconFa: 'fa fa-cubes', color: 'var(--beatleader-primary)'},
		{key: 'unranked', label: 'Unranked', iconFa: 'fa fa-cube', color: 'var(--beatleader-primary)'},
	];

	const baseMytypeFilterOptions = [
		{key: '', label: 'All maps', iconFa: 'fa fa-music', color: 'var(--beatleader-primary)'},
		{key: 'played', label: 'Played', iconFa: 'fa fa-user', color: 'var(--beatleader-primary)'},
		{key: 'unplayed', label: 'Not played', iconFa: 'fa fa-times', color: 'var(--beatleader-primary)'},
	];

	let mytypeFilterOptions = baseMytypeFilterOptions;

	const categoryFilterOptions = Object.entries(typesMap).map(([key, type]) => {
		return {
			key: type,
			label: capitalize(typesDescription?.[key]?.name ?? key),
			icon: `<span class="${typesDescription?.[key]?.icon ?? `${key}-icon`}"></span>`,
			color: typesDescription?.[key]?.color ?? 'var(--beatleader-primary',
			textColor: typesDescription?.[key]?.textColor ?? null,
		};
	});

	function addAdditionalFilters(mapper, rt) {
		mytypeFilterOptions = [...baseMytypeFilterOptions];
		if (mapper) {
			mytypeFilterOptions.push({key: 'mymaps', label: 'My maps', iconFa: 'fa fa-cubes', color: 'var(--beatleader-primary)'});
		}
		if (mapper || rt) {
			mytypeFilterOptions.push({key: 'mynominated', label: 'My nominated', iconFa: 'fa fa-cubes', color: 'var(--beatleader-primary)'});
		}
		if (rt) {
			mytypeFilterOptions.push({
				key: 'othersnominated',
				label: "Other's nominated",
				iconFa: 'fa fa-cubes',
				color: 'var(--beatleader-primary)',
			});
		}
	}

	function scrollToTop() {
		if (boxEl) scrollToTargetAdjusted(boxEl, 60);
	}

	const leaderboardsStore = createLeaderboardsStore(page, currentFilters);

	function changePageAndFilters(newPage, newLocation) {
		currentFilters = buildFiltersFromLocation(newLocation);

		sortValues = sortValues1.map(v => {
			let result = {...v};
			if (result.id == currentFilters.sortBy) {
				result.iconFa = `fa fa-long-arrow-alt-${currentFilters.order === 'asc' ? 'up' : 'down'}`;
				sortValue = result;
			}

			return result;
		});

		newPage = parseInt(newPage, 10);
		if (isNaN(newPage)) newPage = 1;

		currentPage = newPage;
		leaderboardsStore.fetch(currentPage, {...currentFilters});
	}

	function onPageChanged(event) {
		if (event.detail.initial || !Number.isFinite(event.detail.page)) return;

		navigate(`/leaderboards/${event.detail.page + 1}?${buildSearchFromFilters(currentFilters)}`);
	}

	function navigateToCurrentPageAndFilters() {
		navigate(`/leaderboards/${currentPage}?${buildSearchFromFilters(currentFilters)}`);
	}

	function onSearchChanged(value) {
		currentFilters.search = value ?? '';
		currentPage = 1;
		navigateToCurrentPageAndFilters();
	}

	function onSearchSubmit(e) {
		e.preventDefault();
		e.stopPropagation();

		if (searchInputEl) onSearchChanged(searchInputEl.value);

		return false;
	}

	function onTypeChanged(event) {
		if (!event?.detail) return;

		currentFilters.type = event.detail.key ?? '';
		currentPage = 1;

		navigateToCurrentPageAndFilters();
	}

	async function onCategoryModeChanged() {
		await tick();

		currentPage = 1;

		navigateToCurrentPageAndFilters();
	}

	function onCategoryChanged(event) {
		if (!event?.detail?.key) return;

		if (!currentFilters.mapType) currentFilters.mapType = 0;

		if (currentFilters.mapType & event.detail.key) currentFilters.mapType &= currentFilters.mapType ^ event.detail.key;
		else currentFilters.mapType |= event.detail.key;

		if (!currentFilters.mapType) currentFilters.mapType = null;

		currentPage = 1;

		navigateToCurrentPageAndFilters();
	}

	function onMyTypeChanged(event) {
		if (!event?.detail) return;

		currentFilters.mytype = event.detail.key ?? '';
		currentPage = 1;

		navigateToCurrentPageAndFilters();
	}

	function onStarsChanged(event) {
		if (!Array.isArray(event?.detail?.values) || event.detail.values.length !== 2) return;

		currentFilters.stars_from = event.detail.values[0];
		currentFilters.stars_to = event.detail.values[1];
		currentPage = 1;

		navigateToCurrentPageAndFilters();
	}
	const debouncedOnStarsChanged = debounce(onStarsChanged, FILTERS_DEBOUNCE_MS);

	let sortValues1 = [
		{id: 'stars', label: 'Star', title: 'Sort by stars', iconFa: 'fa fa-star'},
		{id: 'name', label: 'Name', title: 'Sort by name', iconFa: 'fa fa-a'},
		{id: 'timestamp', label: 'Map date', title: 'Sort by the map date', iconFa: 'fas fa-map'},
		{id: 'voting', label: 'Voting', title: 'Sort by positive minus negative vote count', iconFa: 'fas fa-vote-yea'},
		{id: 'voteratio', label: 'Vote ratio', title: 'Sort by vote ratio', iconFa: 'far fa-smile-beam'},
		{id: 'votecount', label: 'Vote count', title: 'Sort by amount of votes for the map', iconFa: 'fa fa-calculator'},
		{id: 'playcount', label: 'Plays', title: 'Sort by play count', iconFa: 'fa fa-user'},
		{id: 'scoreTime', label: 'Newest score', title: 'Sort by the last made score', iconFa: 'fa fa-leaf'},
	];
	let sortValues = sortValues1;
	let sortValue = sortValues[0];

	function onSortChange(event) {
		if (!event?.detail?.id) return null;

		if (currentFilters.sortBy == event.detail.id) {
			currentFilters.order = currentFilters.order === 'asc' ? 'desc' : 'asc';
		} else {
			currentFilters.sortBy = event.detail.id;
		}

		currentPage = 1;

		navigateToCurrentPageAndFilters();
	}

	function onDateRangeChange(event) {
		if (!event?.detail) return;

		currentFilters.date_from = event.detail?.from ? event.detail.from.getTime() / 1000 : null;
		currentFilters.date_to = event.detail?.to ? (event.detail.to.getTime() + DAY) / 1000 : null;

		currentPage = 1;

		navigateToCurrentPageAndFilters();
	}

	const debouncedOnDateRangeChanged = debounce(onDateRangeChange, FILTERS_DEBOUNCE_MS);

	let searchToPlaylist = false;
	let makingPlaylist = false;
	let mapCount = 100;
	function generatePlaylist() {
		makingPlaylist = true;
		playlists.generatePlaylist(mapCount, currentFilters, () => {
			navigate('/playlists');
		});
	}

	$: isLoading = leaderboardsStore.isLoading;
	$: pending = leaderboardsStore.pending;
	$: numOfMaps = $leaderboardsStore ? $leaderboardsStore?.metadata?.total : null;
	$: itemsPerPage = $leaderboardsStore ? $leaderboardsStore?.metadata?.itemsPerPage : 10;
	$: isRT =
		$account.player &&
		$account.player.playerInfo.role &&
		($account.player.playerInfo.role.includes('admin') || $account.player.playerInfo.role.includes('rankedteam'));

	$: addAdditionalFilters($account.player && $account.player.playerInfo.mapperId, isRT);

	$: changePageAndFilters(page, location);
	$: scrollToTop($pending);

	$: leaderboardsPage = ($leaderboardsStore?.data ?? []).map(m => {
		return {
			...m,
			diffInfo: {diff: m?.difficulty?.difficultyName, type: m?.difficulty?.modeName},
			stars: m?.difficulty?.stars ?? null,
		};
	});
</script>

<svelte:head>
	<title>Maps / {currentPage} - {ssrConfig.name}</title>
</svelte:head>

<section class="align-content">
	<article class="page-content" transition:fade>
		<ContentBox bind:box={boxEl}>
			<h1 class="title is-5">
				Maps

				{#if $isLoading}<Spinner />{/if}
			</h1>

			<RankedTimer />

			{#if leaderboardsPage?.length}
				<div class="songs grid-transition-helper">
					{#each leaderboardsPage as map, idx (map.id)}
						<div class={`song-line row-${idx}`} in:fly={{delay: idx * 10, x: 100}}>
							<div class="icons mobile-only">
								{#if map?.song?.hash?.length}
									<Icons hash={map.song.hash} diffInfo={map?.diffInfo} />
								{/if}
							</div>

							<div class="main">
								<SongCover leaderboard={map} url={`/leaderboard/global/${map.id}/1`} />

								<div class="songinfo">
									<a href={`/leaderboard/global/${map.id}/1`} on:click|preventDefault={() => navigate(`/leaderboard/global/${map.id}/1`)}>
										<span class="name">{map?.song?.name} {map?.song?.subName}</span>
										<div class="author">{map?.song?.author} <small>{map?.song?.mapper}</small></div>
									</a>
								</div>

								{#if map?.votes}
									<div>
										{#if isRT && map?.votes.filter(v => v.stars > 0).length}
											{formatNumber(
												map?.votes.filter(v => v.stars > 0).reduce((a, b) => a + b.stars, 0) / map?.votes.filter(v => v.stars > 0).length
											)}★
										{/if}
										<span
											title="{map?.votes.filter(v => v.rankability > 0).length} rankable / {map?.votes.filter(v => v.rankability <= 0)
												.length} unrankable">
											{#if currentFilters.sortBy == 'voting'}
												Rating: {map?.votes.filter(v => v.rankability > 0).length - map?.votes.filter(v => v.rankability <= 0).length}
											{:else if currentFilters.sortBy == 'voteratio'}
												Ratio: {formatNumber((map?.votes.filter(v => v.rankability > 0).length / map?.votes.length) * 100)}%
											{:else}
												{map?.votes.length} vote{map?.votes.length > 1 ? 's' : ''}
											{/if}
										</span>
									</div>
								{/if}

								{#if map?.plays}
									<div>
										{map?.plays} plays.
									</div>
								{/if}

								{#if map?.song?.hash?.length}
									<div class="icons tablet-and-up">
										<Icons hash={map.song.hash} diffInfo={{diff: map?.difficulty?.difficultyName, type: map?.difficulty?.modeName}} />
									</div>
								{/if}
							</div>

							{#if map?.difficulty?.status == DifficultyStatus.nominated || map?.difficulty?.status == DifficultyStatus.qualified}
								<QualificationStatusSmall qualification={map.qualification} />
							{/if}

							{#if map?.reweight && !map.reweight.finished}
								<ReweightStatusSmall {map} />
							{/if}

							{#if map?.difficulty?.status == DifficultyStatus.ranked && !map.qualification}
								<span style="color: white;">
									Mapper decision: <span
										style={`color: ${formatDiffApprovalColor(map?.difficulty?.status, map?.difficulty?.mapperApproval)};`}>
										{formatDiffApproval(map?.difficulty?.status, map?.difficulty?.mapperApproval)}</span>
								</span>
							{/if}

							{#if map?.myScore}
								<SongScore
									playerId={map.myScore.playerId}
									songScore={processScore({leaderboard: map, ...map.myScore})}
									showSong={false}
									noIcons={true}
									inList={false}
									{idx}
									service={'beatleader'} />
							{/if}
						</div>
					{/each}
				</div>

				<Pager
					totalItems={numOfMaps}
					{itemsPerPage}
					itemsPerPageValues={null}
					currentPage={currentPage - 1}
					loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
					mode={numOfMaps ? 'pages' : 'simple'}
					on:page-changed={onPageChanged} />
			{:else if !$isLoading}
				<p>No maps found.</p>
			{/if}
		</ContentBox>
	</article>

	<aside>
		<ContentBox>
			<h2 class="title is-5">Sorting</h2>

			<Switcher values={sortValues} value={sortValue} on:change={onSortChange} />

			<h2 class="title is-5">Filters</h2>

			<section class="filter">
				<label>Song/Author/Mapper Name</label>

				<form on:submit={onSearchSubmit}>
					<input bind:this={searchInputEl} type="text" class="search" placeholder="Search for a map..." value={currentFilters.search} />
				</form>
			</section>

			<section class="filter">
				<Switcher values={typeFilterOptions} value={typeFilterOptions.find(o => o.key === currentFilters.type)} on:change={onTypeChanged} />
			</section>

			{#if $account.id}
				<section class="filter">
					<Switcher
						values={mytypeFilterOptions}
						value={mytypeFilterOptions.find(o => o.key === currentFilters.mytype)}
						on:change={onMyTypeChanged} />
				</section>
			{/if}

			<select bind:value={currentFilters.allTypes} on:change={onCategoryModeChanged}>
				<option value={false}>ANY category</option>
				<option value={true}>ALL categories</option>
			</select>

			<section class="filter">
				<Switcher
					values={categoryFilterOptions}
					value={categoryFilterOptions.filter(c => currentFilters.mapType & c.key)}
					multi={true}
					on:change={onCategoryChanged} />
			</section>

			<section
				class="filter"
				class:disabled={currentFilters.type !== 'ranked'}
				title={currentFilters.type !== 'ranked' ? 'Filter only available for ranked maps' : null}>
				<label>
					Stars
					<span>{formatNumber(currentFilters.stars_from)}<sup>★</sup></span> to
					<span>{formatNumber(currentFilters.stars_to)}<sup>★</sup></span>
				</label>
				<RangeSlider
					range
					min={MIN_STARS}
					max={MAX_STARS}
					step={0.1}
					values={[currentFilters.stars_from, currentFilters.stars_to]}
					float
					hoverable
					pips
					pipstep={20}
					all="label"
					on:change={debouncedOnStarsChanged}
					disabled={currentFilters.type !== 'ranked'} />
			</section>

			<section class="filter">
				<label>Date range</label>

				<DateRange
					type="date"
					dateFrom={dateFromUnix(currentFilters.date_from)}
					dateTo={dateFromUnix(currentFilters.date_to)}
					on:change={debouncedOnDateRangeChanged} />
			</section>

			<h2 class="title is-5">Playlists</h2>
			<div class="playlist-buttons">
				<Button
					cls="playlist-button"
					iconFa="fas fa-cubes"
					label="Ranked"
					bgColor="var(--beatleader-primary)"
					color="white"
					on:click={() => navigate('/playlist/ranked')} />
				<Button
					cls="playlist-button"
					iconFa="fas fa-check"
					label="Qualified"
					type="primary"
					on:click={() => navigate('/playlist/qualified')} />
				<Button cls="playlist-button" iconFa="fas fa-rocket" label="Nominated" on:click={() => navigate('/playlist/nominated')} />
				<Button
					cls="playlist-button"
					iconFa="fas fa-list"
					type={searchToPlaylist ? 'danger' : 'default'}
					label={searchToPlaylist ? 'Cancel' : 'Playlist from search'}
					on:click={() => (searchToPlaylist = !searchToPlaylist)} />
			</div>
			{#if searchToPlaylist}
				{#if makingPlaylist}
					<Spinner />
				{:else}
					<span>Maps count:</span>
					<RangeSlider
						range
						min={0}
						max={1000}
						step={1}
						values={[mapCount]}
						hoverable
						float
						pips
						pipstep={100}
						all="label"
						on:change={event => {
							mapCount = event.detail.values[0];
						}} />
					<Button cls="playlist-button" iconFa="fas fa-wand-magic-sparkles" label="Generate playlist" on:click={() => generatePlaylist()} />
				{/if}
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

	aside select {
		background-color: transparent;
		margin-bottom: 0.25em;
	}

	aside select option {
		color: var(--textColor);
		background-color: var(--background);
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

	input::placeholder {
		color: var(--faded) !important;
	}

	.songs :global(> *:last-child) {
		border-bottom: none !important;
	}

	.song-line {
		border-bottom: 1px solid var(--dimmed);
		padding: 0.5em 0;
	}

	.song-line .icons.up-to-tablet + .main {
		padding-top: 0;
	}

	.song-line .main {
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		justify-content: center;
		grid-column-gap: 0.75em;
	}

	.song-line .main > *:last-child {
		margin-right: 0;
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

	.icons {
		width: 7em;
		font-size: 0.75em;
		text-align: right;
		margin-right: 0;
		margin-bottom: 0.5em;
	}

	.icons:empty {
		margin-bottom: 0 !important;
	}

	.icons :global(> *) {
		margin-bottom: 0.25em !important;
	}

	.playlist-buttons {
		display: flex;
		margin-top: 1em;
		column-gap: 0.5em;
		flex-wrap: wrap;
	}

	:global(.playlist-button) {
		height: 1.6em;
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

	@media screen and (max-width: 767px) {
		.icons {
			margin-bottom: 0.5em;
			width: 100%;
		}

		.playlist-buttons {
			flex-direction: column;
		}
	}
</style>
