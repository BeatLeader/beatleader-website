<script>
    import {configStore} from '../stores/config'
    import ssrConfig from '../ssr-config'
    import createAccountStore from '../stores/beatleader/account'
    import Billboard from "../components/Dashboard/Billboard.svelte";
    import Button from "../components/Common/Button.svelte";
    import SearchPage from './Search.svelte'
    import ContentBox from "../components/Common/ContentBox.svelte";
    import RankingTable from '../components/Ranking/RankingTable.svelte'
    import Spinner from '../components/Common/Spinner.svelte'

    let page = 1;
    let filters = {sortBy: 'pp'}

    let isLoading = false;
    let pending = null;

    const account = createAccountStore();

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

    function toggleSortBy() {
        filters.sortBy = filters.sortBy === "dailyImprovements" ? "pp" : "dailyImprovements";
    }

    function onPageChanged(event) {
        if (event.detail.initial || !Number.isFinite(event.detail.page)) return;

        page = event.detail.page + 1;
    }

    $: friends = $account?.friends ?? null;
    $: billboardState = $configStore?.preferences?.billboardState;
    $: updateTabs(billboardState);
</script>

<svelte:head>
  {#if !friends?.length}
  <title>{$account?.player?.name}</title>
  {:else}
  <title>Dashboard - {ssrConfig.name}</title>
  {/if}
</svelte:head>

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
                                      on:page-changed={onPageChanged}
                                      on:sort-toggled={toggleSortBy}
                                      on:loading={e => isLoading = !!e?.detail}
                                      on:pending={e => pending = e?.detail}
                        />
<!--                        <Ranking players={playersFilter} {overridePlayersPp} itemsPerPage={20} filterFunc={rankingFilter} {refreshTag}/>-->
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

            <div class="scores content column is-full is-three-fifths-fullhd">
                <ContentBox>
                    <header>
                        <h2>
                            <div class="title is-5">Recent scores</div>
                        </h2>
                    </header>
<!--                    <Songs players={playersFilter} sortBy="timeSet" filterFunc={songScoresFilter} {refreshTag}-->
<!--                        min={new Date(Date.now()-values.selectedSongPeriod.value*1000*60*60*24)}-->
<!--                        itemsPerPage={5} pagesDisplayMax={7} noRank={true}/>-->
                </ContentBox>

                <ContentBox>
                    <div>
                        <header>
                            <h2 class="title is-5">Best scores</h2>
                        </header>
    
<!--                        <Songs players={playersFilter} sortBy="pp" filterFunc={songScoresFilter} min={minPp} itemsPerPage={5} pagesDisplayMax={7} {refreshTag} />-->
                    </div>
                    
                </ContentBox>
            </div>
        </div>
    </div>
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
    }

    .ranking header nav {
        font-size: .8em!important;
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