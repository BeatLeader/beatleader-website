<script>
    import Ranking from "../components/Dashboard/Ranking.svelte";
    import Songs from "../components/Dashboard/Songs.svelte";
    import Billboard from "../components/Dashboard/Billboard.svelte";
    import Switcher from '../components/Common/Switcher.svelte'
    import Button from "../components/Common/Button.svelte";
    import Range from "../components/Common/Range.svelte";
    import Select from "../components/Common/Select.svelte";
    // import Refresh from "../components/Player/Refresh.svelte";
    import createPlayersStore from '../stores/beatleader/players'
    import SearchPage from './Search.svelte'
    import ssrConfig from '../ssr-config'
    import players from "../db/repository/players";
    import ContentBox from "../components/Common/ContentBox.svelte";
    import {configStore} from '../stores/config'

    export let overridePlayersPp = {};

    var playersFilter = [];
    let refreshTag = null;
    let playersStore = createPlayersStore();

    let strings = {
        lastSongsPeriods: [
            {_key: 'dashboard.periods.last3Days', label: "Last 3 Days", value: 3},
            {_key: 'dashboard.periods.lastWeek', label: "Last Week", value: 7},
            {_key: 'dashboard.periods.last2Weeks', label: "Last 2 Weeks", value: 14},
            {_key: 'dashboard.periods.lastMonth', label: "Last Month", value: 30},
        ],
    }

    let values = {
        selectedSongPeriod: strings.lastSongsPeriods.find(p => p.value === 14),
    }

    async function filterPlayers() {
        let players = await playersStore.get();

        playersFilter = players;// ? players.filter(player => player.name).map(player => player.id).filter(s => s) : [];
    }

    let minPp = 300;

    function onTypeChange() {
        const cont = document.querySelector('body > .section > .container.original');
        const newCont = document.querySelector('body > .section > main');
        if (!cont || !newCont) return;

        newCont.style.display = 'none';
        cont.style.display = 'block';
    }

    function songScoresFilter(song) {
        return playersFilter;
    }

    function rankingFilter(player) {
        return playersFilter && playersFilter.includes(player.id);
    }

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
        if (billboardState == 'show') {
            allTabs = [billboardTab, topScoresTab];
            tab = billboardTab;
            selectedTabId = billboardTab.id;
        } else {
            allTabs = [topScoresTab, billboardTab];
            tab = topScoresTab;
            selectedTabId = topScoresTab.id;
        }
    }

    function onServiceChanged(event) {
        if (!event?.detail?.id) return;

        tab = event.detail;
        selectedTabId = event.detail.id;
    }

    $: {
        filterPlayers();
        playersStore.subscribe(value => {
		    playersFilter = value;
	    });
    }
    $: billboardState = $configStore?.preferences?.billboardState;
    $: updateTabs(billboardState);
</script>

<svelte:head>
  {#if !playersFilter.length}
  <title>{ssrConfig.name}</title>
  {:else}
  <title>Dashboard - {ssrConfig.name}</title>
  {/if}
</svelte:head>

{#if !playersFilter.length}
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
            <div class="leaderboard content column is-full-tablet is-half-widescreen is-two-fifths-fullhd">
                <ContentBox>
                    <div class="ranking">
                        <header>
                            <h2 class="title is-5">Ranking</h2>
                        </header>

                        <Ranking players={playersFilter} {overridePlayersPp} itemsPerPage={20} filterFunc={rankingFilter} {refreshTag}/>
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

            <div class="scores content column is-full-tablet is-half-widescreen is-three-fifths-fullhd">
                <ContentBox>
                    <header>
                        <h2>
                            <div class="title is-5">Recent scores</div>
                        </h2>
                        <nav>
                            <Select bind:value={values.selectedSongPeriod} items={strings.lastSongsPeriods} right={true}/>
                        </nav>
                    </header>
                    <Songs players={playersFilter} sortBy="timeSet" filterFunc={songScoresFilter} {refreshTag}
                        min={new Date(Date.now()-values.selectedSongPeriod.value*1000*60*60*24)}
                        itemsPerPage={5} pagesDisplayMax={7} noRank={true}/>
                </ContentBox>

                <ContentBox>
                    {#if billboardState != 'hide'}
                        <Switcher values={allTabs} value={tab} on:change={onServiceChanged}/>
                    {/if}

                    {#if selectedTabId == "topscores"}
                        <div>
                            <header>
                                <h2 class="title is-5">Best scores</h2>
                                <nav>
                                    <Range bind:value={minPp} min={0.1} max={700} step={1} suffix="pp" inline={true}/>
                                </nav>
                            </header>
        
                            <Songs players={playersFilter} sortBy="pp" filterFunc={songScoresFilter} min={minPp} itemsPerPage={5} pagesDisplayMax={7} {refreshTag} />
                        </div>
                    {:else if selectedTabId == "billboard"}
                        <Billboard />
                    {/if}
                    
                </ContentBox>
            </div>
        </div>
    </div>
{/if}

<style>
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

    .filters {
        display: flex;
        justify-content: flex-start;
        margin-bottom: .5rem;
        margin-top: 2.5rem;
    }

    .box {
        min-height: 12rem;
        overflow-x: hidden;
        padding: .75rem 1rem 1rem 1rem;
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

    .ranking header nav {
        font-size: .8em!important;
    }

    .country-remove {
        text-align: right;
        font-size: .75em;
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