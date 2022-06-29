<script>
  import {navigate} from "svelte-routing";
  import {fade} from 'svelte/transition'
	import {
		createBuildFiltersFromLocation,
		buildSearchFromFilters,
		processStringFilter,
		processStringArrayFilter, processIntFilter,
	} from '../utils/filters'
  import {capitalize} from '../utils/js'
  import {scrollToTargetAdjusted} from '../utils/browser'
  import ssrConfig from '../ssr-config'
  import Spinner from '../components/Common/Spinner.svelte'
  import ContentBox from "../components/Common/ContentBox.svelte";
  import RankingTable from '../components/Ranking/RankingTable.svelte'
  import {debounce} from '../utils/debounce'
	import Switcher from '../components/Common/Switcher.svelte'
	import Countries from '../components/Ranking/Countries.svelte'

  export let type = 'global';
  export let page = 1;

  document.body.classList.remove('slim');


  const FILTERS_DEBOUNCE_MS = 500;

	const findParam = key => params.find(p => p.key === key);

	const onInputChange = (e, key) => {
		const param = findParam(key);
		if (param) {
			param.value = e.target.value ?? '';

			updateCurrentFiltersFromParams();
		}
	}
	const onMultiSwitchChange = (e, key) => {
		const param = findParam(key);
		if (param) {
			param.value = (param?.value ?? []).includes(e.detail)
				? (param?.value ?? []).filter(p => p?.id !== e.detail.id)
				: [...(param?.value ?? []), e.detail];

			updateCurrentFiltersFromParams();
		}
	}
  const params = [
    {
      key: 'search',
      label: 'Player name',
      default: '',
      process: processStringFilter,
      type: 'input',
			value: '',
			placeholder: 'Enter at least 3 characters...',
      onChange: e => {
				const length = e?.target?.value?.length
				if (length > 0 && length < 3) return;

				onInputChange(e, 'search');
      }
    },
		{
			key: 'countries',
			label: 'Countries',
			default: '',
			process: processStringArrayFilter,
			type: 'countries',
			value: [],
			values: [],
			onChange: e => onMultiSwitchChange(e, 'platform'),
			multi: true
		},
    {
      key: 'platform',
      label: 'Platform',
      default: '',
      process: processStringArrayFilter,
      type: 'switch',
			value: [],
			values: [
				{id: 'steam', 'label': 'Steam', },
				{id: 'oculus', 'label': 'Oculus Android'},
				{id: 'oculuspc', 'label': 'Oculus PC'},
			],
			onChange: e => onMultiSwitchChange(e, 'platform'),
			multi: true
    },
		{
			key: 'hmd',
			label: 'HMD',
			default: '',
			process: processIntFilter,
			type: 'switch',
			value: [],
			values: [
				{id: 0, 'label': 'Oculus Rift CV1', },
				{id: 1, 'label': 'Vive', },
				{id: 2, 'label': 'Vive Pro', },
				{id: 4, 'label': 'Rift S', },
				{id: 3, 'label': 'Windows Mixed Reality', },
				{id: 5, 'label': 'Oculus Quest', },
				{id: 6, 'label': 'Valve Index', },
				{id: 7, 'label': 'Vive Cosmos', },
				{id: 8, 'label': 'Oculus Quest 2', },
			],
			onChange: e => onMultiSwitchChange(e, 'hmd'),
			multi: true,
			bitArray: true,
		},
		{
			key: 'role',
			label: 'Role',
			default: '',
			process: processStringArrayFilter,
			type: 'switch',
			value: [],
			values: [
				{id: 'admin', 'label': 'Administrator',},
				{id: 'rankedteam', 'label': 'Ranked Team',},
				{id: 'tipper', 'label': 'Tipper',},
				{id: 'supporter', 'label': 'Supporter',},
				{id: 'sponsor', 'label': 'Sponsor',},
			],
			onChange: e => onMultiSwitchChange(e, 'role'),
			multi: true
		},
  ];

  const buildFiltersFromLocation = createBuildFiltersFromLocation(
    params,
    filters => {
			params.forEach(p => {
				if (p.bitArray) {
					p.value = (p?.values ?? []).filter(v=> Number.isFinite(v.id) && ((1 << v.id) & (filters?.[p.key] ?? 0) ));
				} else if (p.key === 'countries') {
					p.value = Array.isArray(filters?.[p.key]) ? filters[p.key] : [];
				} else {
					filters[p.key] = p.multi
						? (
							(p?.values ?? [])
								?.map(v => v?.id)
								?.filter(v => filters?.[p.key]?.includes(v))
							?? []
						)
						: (filters?.[p.key] ?? '');

					p.value = p.multi ? (p?.values?.filter(v => filters?.[p.key]?.includes(v.id)) ?? []) : (filters?.[p.key] ?? '');
				}
			});

      return filters;
    }
  );

  document.body.classList.add('slim');

  if (page && !Number.isFinite(page)) page = parseInt(page, 10);
  if (!page || isNaN(page) || page <= 0) page = 1;

  let currentType = type;
  let currentPage = page;
  let currentFilters = buildFiltersFromLocation(location);
  let boxEl = null;

  let isLoading = false;
  let pending = null;

  if (!currentFilters?.sortBy?.length) {
      currentFilters.sortBy = 'pp';
  }

	function updateCurrentFiltersFromParams() {
		params.forEach(p => {
			if (p.bitArray) {
				currentFilters[p.key] = (p?.value ?? []).map(v => v?.id).reduce((prev, i) => prev + (1 << i), 0)
			} else {
				currentFilters[p.key] = p.multi ? (p?.value ?? [])?.map(p => p.id)?.join(',') : (p?.value ?? '');
			}
		});

		params = params;

		navigateToCurrentPageAndFilters();
	}

  function scrollToTop() {
    if (boxEl) scrollToTargetAdjusted(boxEl, 44)
  }

  function changeParams(newType, newPage, newLocation) {
    currentType = newType;
    currentFilters = buildFiltersFromLocation(newLocation);
    if (!currentFilters?.sortBy?.length) {
      currentFilters.sortBy = 'pp';
    }
    newPage = parseInt(newPage, 10);
    if (isNaN(newPage)) newPage = 1;

    currentPage = newPage;

    navigateToCurrentPageAndFilters();
  }

  function onPageChanged(event) {
    if (event.detail.initial || !Number.isFinite(event.detail.page)) return;

    navigate(`/ranking/${currentType}/${event.detail.page + 1}?${buildSearchFromFilters(currentFilters)}`);
  }

  function navigateToCurrentPageAndFilters() {
    navigate(`/ranking/${currentType}/${currentPage}?${buildSearchFromFilters(currentFilters)}`);
  }

  function toggleSortBy() {
    currentFilters.sortBy = currentFilters.sortBy === "dailyImprovements" ? "pp" : "dailyImprovements";

    navigateToCurrentPageAndFilters();
  }

  $: typeName = type && type.toUpperCase && !['global', 'friends'].includes(type) ? type.toUpperCase() : capitalize(type)
  $: changeParams(type, page, location)
  $: scrollToTop(pending);
</script>

<svelte:head>
  <title>{typeName} ranking / {currentPage} - {ssrConfig.name}</title>
</svelte:head>

<section class="align-content">
  <article class="page-content" transition:fade>
    <ContentBox bind:box={boxEl}>
      <h1 class="title is-5">
        {typeName} leaderboard

        {#if isLoading}
          <Spinner/>
        {/if}
      </h1>

      <RankingTable type={currentType} page={currentPage} filters={currentFilters}
                    on:page-changed={onPageChanged}
                    on:sort-toggled={toggleSortBy}
                    on:loading={e => isLoading = !!e?.detail}
                    on:pending={e => pending = e?.detail}
      />
    </ContentBox>
  </article>

  <aside>
    <ContentBox>
      <h2 class="title is-5">Filters</h2>

      {#each params as param}
        <section class="filter">
          <label>{param?.label ?? param?.key ?? ''}</label>

					{#if param?.type === 'input'}
						<input type="text" placeholder={param.placeholder ?? null} value={param.value}
									 on:input={debounce(param.onChange, FILTERS_DEBOUNCE_MS)}
						/>
					{:else if param?.type === 'switch'}
						<Switcher values={param.values} value={param.value} multi={!!param?.multi}
											on:change={param.onChange}
						/>
					{:else if param?.type === 'countries'}
						<Countries value={param.value} on:change={param.onChange} />
					{/if}
        </section>
      {/each}
    </ContentBox>
  </aside>
</section>

<style>
    .align-content {
        display: flex;
        justify-content: flex-end!important;
    }

    .page-content {
        max-width: 65em;
        width: 100%;
    }

    aside {
      width: 25em;
    }

    aside .filter {
      margin-bottom: 1.5rem;
      transition: opacity 300ms;
    }

    aside .filter.disabled {
      opacity: .25;
    }

    aside label {
      display: block;
      font-weight: 500;
      margin-bottom: 1rem;
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