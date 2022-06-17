<script>
    import {navigate} from "svelte-routing";
    import {fly} from 'svelte/transition'
    import createClanStore from '../stores/http/http-clan-store'
    import createAccountStore from '../stores/beatleader/account'
    import createConfigService from '../services/config'
    import {scrollToTargetAdjusted} from '../utils/browser'
    import ssrConfig from '../ssr-config'
    import Pager from '../components/Common/Pager.svelte'
    import Spinner from '../components/Common/Spinner.svelte'
    import ContentBox from "../components/Common/ContentBox.svelte";
    import {debounce} from '../utils/debounce'
    import createClanService from '../services/beatleader/clan'
    import {SsrHttpResponseError} from '../network/errors'
    import PlayerCard from "../components/Ranking/PlayerCard.svelte";
    import ClanInfo from '../components/Clans/ClanInfo.svelte'
    import Button from '../components/Common/Button.svelte'
    import Dialog from '../components/Common/Dialog.svelte'
    import Error from '../components/Common/Error.svelte'

    export let clanId;
    export let page = 1;
    export let location;

    const FILTERS_DEBOUNCE_MS = 500;

    document.body.classList.remove('slim');

    const mainPlayerId = createConfigService().getMainPlayerId();
    const clanService = createClanService();

    if (page && !Number.isFinite(page)) page = parseInt(page, 10);
    if (!page || isNaN(page) || page <= 0) page = 1;

    const buildFiltersFromLocation = location => {
      const processString = val => val?.toString() ?? '';

      const params = [
        {key: 'search', default: '', process: processString},
      ];

      const searchParams = new URLSearchParams(location?.search ?? '');

      return params.reduce((cum, param) => ({
        ...cum,
        [param.key]: param.process(searchParams.get(param.key)) ?? param.default
      }), {});
    }
    const buildSearchFromFilters = filters => {
      if (!filters) return '';

      const searchParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => searchParams.append(key, value));

      return searchParams.toString();
    }

    let currentPage = page;
    let currentFilters = buildFiltersFromLocation(location);
    let boxEl = null;

    function scrollToTop() {
      if (boxEl) scrollToTargetAdjusted(boxEl, 44)
    }

    const clanStore = createClanStore(clanId, page, currentFilters);

    function changePageAndFilters(clanId, newPage, newLocation) {
      if (!clanId) return;

      currentFilters = buildFiltersFromLocation(newLocation);

      newPage = parseInt(newPage, 10);
      if (isNaN(newPage)) newPage = 1;

      currentPage = newPage;
      clanStore.fetch(clanId, currentPage, {...currentFilters});
    }

    function onPageChanged(event) {
      if (event.detail.initial || !Number.isFinite(event.detail.page)) return;

      navigate(`/clan/${clanId}/${event.detail.page + 1}?${buildSearchFromFilters(currentFilters)}`);
    }

    function navigateToCurrentPageAndFilters() {
      navigate(`/clan/${clanId}/${currentPage}?${buildSearchFromFilters(currentFilters)}`);
    }

    function onSearchChanged(e) {
      currentFilters.search = e.target.value ?? '';
      navigateToCurrentPageAndFilters();
    }
    const debouncedOnSearchChanged = debounce(onSearchChanged, FILTERS_DEBOUNCE_MS);

    const account = createAccountStore();

    const canBeKicked = (clan, player) => clan?.leaderID && clan.leaderID !== player?.playerId;

    let kickedPlayer = null;
    let kickingError = null;
    async function onKick(player) {
      if (!player?.playerId) return;

      try {
        kickingError = null;

        await clanService.kick(player);

        kickedPlayer = null;

        await clanStore.refresh();
      } catch (err) {
        if (err instanceof SsrHttpResponseError) {
          const htmlError = await err.getResponse().text();
          kickingError = htmlError?.length ? htmlError : err;
        } else {
          kickingError = err;
        }
      }
    }

    $: isLoading = clanStore.isLoading;
    $: pending = clanStore.pending;
    $: numOfItems = $clanStore ? $clanStore?.metadata?.total : null;
    $: itemsPerPage = $clanStore ? $clanStore?.metadata?.itemsPerPage : 10;

    $: changePageAndFilters(clanId, page, location)
    $: scrollToTop($pending);

    $: clan = $clanStore?.container ?? null;
    $: playersPage = ($clanStore?.data ?? []);

    $: clanLeaderId = clan?.leaderID ?? null;
    $: isFounder = clan?.id && clanLeaderId === $account?.player?.id;
  </script>

  <svelte:head>
    <title>{clan?.name ?? ''} / {currentPage} - {ssrConfig.name}</title>
  </svelte:head>

  <section class="align-content">
    <article class="page-content">
      <ContentBox bind:box={boxEl}>
        <ClanInfo {clan}
                  on:removed={() => navigate('/clans?refresh=true')}
                  on:accepted={() => clanStore.refresh()}
                  on:left={() => clanStore.refresh()}
        />

        {#if $isLoading}<Spinner />{/if}

        {#if kickedPlayer}
          <Dialog type="confirm" title="Are you sure?" okButton="Yeah!" cancelButton="Hell no!"
                  on:confirm={() => onKick(kickedPlayer)}
                  on:cancel={() => kickedPlayer = null}
          >
            <div slot="content">
              <div>You will kick <strong>{kickedPlayer?.name ?? '<Unknown player>'}</strong> out of the clan...</div>

              {#if kickingError}
                <Error error={kickingError} />
              {/if}
            </div>
          </Dialog>
        {/if}

        {#if playersPage?.length}
          <div class="players grid-transition-helper" class:with-icons={isFounder}>
            {#each playersPage as player, idx (player.playerId)}
            <div class="ranking-grid-row" in:fly={{delay: idx * 10, x: 100}}>
              <PlayerCard player={player} playerId={mainPlayerId} withCrown={clanLeaderId === player.playerId} selectedClanTag={clan?.tag} />

              {#if isFounder && canBeKicked(clan, player)}
                <Button iconFa="fas fa-trash-alt" title="Kick a player out of the clan" type="danger" noMargin={true}
                        on:click={() => kickedPlayer = player}
                />
              {/if}
            </div>
          {/each}
          </div>

          <Pager totalItems={numOfItems} {itemsPerPage} itemsPerPageValues={null}
                 currentPage={currentPage-1} loadingPage={$pending && $pending.page ? $pending.page - 1 : null}
                 mode={numOfItems ? 'pages' : 'simple'}
                 on:page-changed={onPageChanged}
          />
        {:else if (!$isLoading)}
          <p>No clans found.</p>
        {/if}
      </ContentBox>
    </article>
  </section>

  <style>
    .align-content {
        display: flex;
        align-items: flex-start!important;
        justify-content: center!important;
    }

    .page-content {
        max-width: 65em;
        width: 100%;
    }

    article {
        width: calc(100% - 25em);
        overflow-x: hidden;
    }

    .ranking-grid-row {
        display: grid;
        grid-template-columns: auto 2.4em;
        grid-gap: .4em;
        align-items: center;
        justify-items: center;
    }

    .players {
        margin-top: 1rem;
        grid-gap: .5em;
    }

    .players:not(.with-icons) .ranking-grid-row {
        grid-template-columns: 1fr;
    }

    .players :global(> *:last-child) {
        border-bottom: none !important;
    }
  </style>