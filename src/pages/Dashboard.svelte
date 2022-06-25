<script>
    import {configStore} from '../stores/config'
    import ssrConfig from '../ssr-config'
    import createAccountStore from '../stores/beatleader/account'
    import createServiceParamsManager from '../components/Player/utils/service-param-manager'
    import Button from "../components/Common/Button.svelte";
    import SearchPage from './Search.svelte'
    import ContentBox from "../components/Common/ContentBox.svelte";
    import RankingTable from '../components/Ranking/RankingTable.svelte'
    import Spinner from '../components/Common/Spinner.svelte'
    import Scores from '../components/Player/Scores.svelte'

    const SPECIAL_PLAYER_ID = 'user-friends';

    let page = 1;
    let filters = {sortBy: 'pp'}

    let isLoading = false;
    let pending = null;

    const account = createAccountStore();

    const serviceParamsManager = createServiceParamsManager('user-friends');
    serviceParamsManager.initFromUrl('beatleader/date/1');
    serviceParamsManager.update({filters: {count: 5}})

    let serviceParams = {sort:"date", order:"desc", page:1, filters:{count: 5}};

    const billboardTab = {
      id: 'billboard',
      label: 'Billboard',
      icon: '<i class="fas fa-clipboard-list"></i>',
      url: `/dashboard`
    };
    const topScoresTab = {
      id: 'topscores',
      label: 'Top Scores',
      icon: '<i class="fab fa-grav"></i>',
      url: `/dashboard`
    };
    let allTabs = [];

    let tab;
    let selectedTabId;

    function updateTabs(billboardState) {
        if (billboardState === 'show') {
            allTabs = [billboardTab, topScoresTab];
            tab = billboardTab;
            selectedTabId = billboardTab.id;
        } else {
            allTabs = [topScoresTab, billboardTab];
            tab = topScoresTab;
            selectedTabId = topScoresTab.id;
        }
    }

    function toggleRankingSortBy() {
        filters.sortBy = filters.sortBy === "dailyImprovements" ? "pp" : "dailyImprovements";
    }

    function onRankingPageChanged(e) {
        if (e.detail.initial || !Number.isFinite(e.detail.page)) return;

        page = e.detail.page + 1;
    }

    function onScoresPageChanged(e) {
        let newPage = e?.detail ?? null;
        if (!newPage) return;

        if (!Number.isFinite(newPage)) newPage = 1;

        serviceParamsManager.update({page: newPage});

        serviceParams = serviceParamsManager.getParams();
    }

    function onScoresParamsChanged(e) {
        const newServiceParams = e?.detail ?? null;
        if (!newServiceParams) return;

        serviceParamsManager.update(newServiceParams);
        serviceParams = serviceParamsManager.getParams();
    }

    $: friends = $account?.friends ?? null;
    $: browserTitle = friends?.length ? $account?.player?.name : `Dashboard - {ssrConfig.name}`
    $: billboardState = $configStore?.preferences?.billboardState;
    $: updateTabs(billboardState);
</script>

<svelte:head>
  <title>{browserTitle}</title>
</svelte:head>

{#if $account?.loading}
    <Spinner />
{:else}
    {#if !friends?.length}
    <div class="sspl-page-container">
        <div class="is-multiline">
            <h1 class="title is-4">Hello, future BeatLeader!</h1>
            <h3 class="description">BeatLeader is a new and open Beat Saber leaderboard!</h3>
            <h3 class="description">It also aggregates data from other cool projects:</h3>
            <div class="sources">
                <h3 class="title is-6">
                    <a class="imageLink" href={`https://beat-savior.herokuapp.com/`} target="_blank" rel="noreferrer">
                        <span class="icon beatsavior-icon" title="BeatSavior"></span>
                    </a>
                </h3>
                <h3 class="title is-6">
                    <a class="imageLink" href={`https://beatsaver.com/`} target="_blank" rel="noreferrer">
                        <img src="https://beatsaver.com/static/favicon/apple-touch-icon.png" class="icon" alt="BeatSaver" title="BeatSaver"/>
                    </a>
                </h3>
                <h3 class="title is-6">
                    <a class="imageLink" href={`https://accsaber.com/`} target="_blank" rel="noreferrer">
                        <img src="/assets/accsaber-logo.png" title="AccSaber" class="icon" alt="AccSaberLogo"/>
                    </a>
                </h3>
                <h3 class="title is-6">
                    <a class="imageLink replays" href={`https://replay.beatleader.xyz/`} target="_blank" rel="noreferrer">
                        <img src="/assets/replays.svg" title="Replays" class="icon" alt="Replays"/>
                    </a>
                </h3>
            </div>
            <div class="downloadButtons">
                <a href="https://github.com/BeatLeader/beatleader-mod/releases" target="_blank" rel="noreferrer">
                    <Button iconFa="fas fa-download" label="Download PC mod"/>
                </a>
                <a href="https://github.com/BeatLeader/beatleader-qmod/releases" target="_blank" rel="noreferrer">
                    <Button iconFa="fas fa-download" label="Download Quest mod"/>
                </a>
            </div>
            <SearchPage focusField={false} title="Find your profile or friends"/>
            <div class="global-ranking-call">
                <h3>Or check <a href="/ranking/global">the global ranking</a> to find the best players.</h3>
            </div>
        </div>
    </div>
    {:else}
        <div class="sspl-page-container">
            <div class="columns is-multiline">
                <div class="leaderboard content column is-full is-two-fifths-fullhd">
                    <ContentBox>
                        <div class="ranking">
                            <header>
                                <h2 class="title is-5">
                                    Friends ranking
                                    {#if isLoading}
                                        <Spinner />
                                    {/if}
                                </h2>
                            </header>

                            <RankingTable type="friends" {page} filters={filters} noIcons={true}
                                          on:page-changed={onRankingPageChanged}
                                          on:sort-toggled={toggleRankingSortBy}
                                          on:loading={e => isLoading = !!e?.detail}
                                          on:pending={e => pending = e?.detail}
                            />
                        </div>
                    </ContentBox>
                    <div class="downloadButtons">
                        <a href="https://github.com/BeatLeader/beatleader-mod/releases" target="_blank" rel="noreferrer">
                            <Button iconFa="fas fa-download" label="Download PC mod"/>
                        </a>
                        <a href="https://github.com/BeatLeader/beatleader-qmod/releases" target="_blank" rel="noreferrer">
                            <Button iconFa="fas fa-download" label="Download Quest mod"/>
                        </a>
                    </div>
                </div>

                <div class="scores content column is-full is-three-fifths-fullhd page-content">
                    <ContentBox>
                        <header>
                            <h2>
                                <div class="title is-5">Friends scores</div>
                            </h2>
                        </header>

                        <Scores playerId="user-friends"
                                initialService="beatleader"
                                initialServiceParams={serviceParams}
                                on:page-changed={onScoresPageChanged}
                                on:service-params-changed={onScoresParamsChanged}
                                fixedBrowserTitle={browserTitle}
                                withPlayers={true}
                                noIcons={true}
                        />
                    </ContentBox>
                </div>
            </div>
        </div>
    {/if}
{/if}

<style>
    .columns {
        width: 100%;
    }
    .sources {
        display: flex;
        margin-left: 1.5em;
        flex-wrap: wrap;
    }

    .description {
        margin-left: 1.5em;
    }

    .title.is-4 {
        margin-top: 1.2em;
        margin-left: 1.2em;
    }

    .global-ranking-call {
        margin-top: 2em;
        margin-left: 1.5em;
    }

    h3 {
        padding: .25em 0;
        margin-bottom: .75em !important;
        font-size: 1.25em;
    }

    h3 > a {
        display: inline-flex;
        align-items: center;
    }

    h3 .icon {
        display: inline-block;
        width: 4em;
        height: 4em;
        margin-right: .5em;
    }

    .box h2 {
        margin-bottom: 0;
    }

    .box h2 {
        display: flex;
        align-items: center;
    }

    .box h2 .title {
        margin-bottom: 0;
    }

    .box h2 .refresh {
        margin-left: 1rem;
        margin-top: -.25em;
        font-size: 1rem;
    }

    header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: .5rem;
    }

    header nav {
        max-width: 15rem;
    }

    .ranking {
        overflow: hidden;
        font-size: .85rem;
    }

    .ranking header nav {
        font-size: .8em!important;
    }

    .ranking :global(.ranking-grid-row) {
        grid-template-columns: auto;
    }

    .ranking :global(.clan-badges) {
        font-size: .8rem;
    }

    .ranking :global(.steam-stats) {
        display: none;
    }

    .imageLink {
        width: 4em;
        height: 4em;
    }

    .imageLink.replays {
        width: 5em;
        height: 5em;
        margin-top: -0.5em;
        margin-left: -0.5em;
    }

    .replays .icon {
        width: 5em;
        height: 5em;
    }

    .downloadButtons {
        margin-top: 1.5em;
        margin-left: 0.6em;
        margin-bottom: 2em;
    }
</style>