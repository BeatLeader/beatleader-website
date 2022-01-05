<script>
    import {onMount} from 'svelte';
    import eventBus from '../../utils/broadcast-channel-pubsub';
    import {debounce} from '../../utils/debounce';
    import {
        getAllActivePlayers,
        getAllScoresSince,
        getAllScoresWithPpOver,
    } from "../../utils/players";
    import {getAccFromScore, getSongDiffInfo, getSongMaxScore} from "../../utils/scoresaber/song";
    import {navigate} from "svelte-routing";

    import Table from '../Common/Table.svelte';
    import Avatar from "../Common/Avatar.svelte";
    import Rank from "../Common/Rank.svelte";
    import PlayerNameWithFlag from "../Common/PlayerNameWithFlag.svelte";
    import Pp from "../Score/Pp.svelte";
    import FormattedDate from "../Common/FormattedDate.svelte";
    import Song from "./Song.svelte";
    import Value from "../Common/Value.svelte";
    import Difficulty from "../Song/Difficulty.svelte";
    import LeaderboardPage from '../../pages/Leaderboard.svelte'
    // import LeaderboardCached from "../Leaderboard/LeaderboardCached.svelte";
    import {convertArrayToObjectByKey} from '../../utils/js'

    export let players;
    export let sortBy = 'timeSet'
    export let min;
    export let noRank = false;
    export let itemsPerPage = 10;
    export let pagesDisplayMax = 10;
    export let filterFunc = null;
    export let refreshTag = null;
    export let leaderboardType = null;
    export let fixedBrowserTitle = null;

    const PLAYERS_SCORES_UPDATED_DEBOUNCE_DELAY = 2000;

    let currentPage = 0;
    let inBuiltLeaderboardPage = null;

    let rows = [];

    const header = [
        {label: '', key: 'picture', className: 'picture'},
        {label: '#', key: 'rank', className: 'rank'},
        {label: 'player', key: 'player', className: 'player'},
        {label: 'song', key: 'song', className: 'song'},
        {label: 'timeset', key: 'timeset', className: 'timeset'},
        {label: 'acc', key: 'acc', className: 'acc'},
        {label: 'pp', key: 'pp', className: 'pp'}
    ].filter(h => !noRank || h.key !== 'rank');

    let scores = [];

    async function refreshScores() {
        const playersScores = sortBy === 'timeSet'
         ? await getAllScoresSince(min ? min : undefined)
         : (
          sortBy === 'pp'
           ? await getAllScoresWithPpOver(min ? min : undefined)
           : await getAllScoresSince()
         );

        const allPlayersArr = players;
        const allPlayers = allPlayersArr ? convertArrayToObjectByKey(allPlayersArr, 'playerId') : {};
        const allPlayersIds = Object.keys(allPlayers);

        const tempScores = playersScores
         .filter(s => allPlayersIds.includes(s.playerId))
         .map(s => {
             const player = allPlayers[s.playerId];
             return {...s, player}
         });

        for (const s of tempScores) {
            if (s.score.acc == Infinity) {
                const maxScore = await getSongMaxScore(s.leaderboard.song.hash, s.leaderboard.diffInfo, s.leaderboard.leaderboardId);
                s.score.acc = getAccFromScore(s.score, maxScore);
             }
        }

        scores = tempScores;
    }

    function refreshRows() {
        if (!scores || !scores.length) return [];

        rows = scores
         .filter(s => (min === undefined || min === null || (s[sortBy] && s[sortBy] >= min)) && (!filterFunc || filterFunc(s)))
         .sort((a, b) => b[sortBy] - a[sortBy])
         .map((s, idx) => ({...s, rank: idx + 1}));
    }

    onMount(async () => {
        const dataRefreshedUnsubscriber = eventBus.on('data-refreshed', async () => await refreshScores());
        const playerScoresUpdatedUnsubscriber = eventBus.on('player-scores-updated', debounce(async () => await refreshScores(), PLAYERS_SCORES_UPDATED_DEBOUNCE_DELAY))

        return () => {
            dataRefreshedUnsubscriber();
            playerScoresUpdatedUnsubscriber();
        }
    });

    async function onDataPage(data, page) {
        const promisesToResolve = [];

        // try to get max score from cache
        for (const i in data) {
            if(!data[i].score.acc) {
                if (!data[i].maxScoreEx && data[i].leaderboard.diffInfo) {
                    try {

                        const songInfo = await getSongDiffInfo(data[i].leaderboard.song.hash, data[i].leaderboard.diffInfo, data[i].leaderboard.leaderboardId, true);
                        songInfo["huuishe"]
                        if (songInfo) {
                            data[i].maxScoreEx = songInfo.maxScore;
                            data[i].acc = getAccFromScore(data[i].score);
                        } else {
                            // try to fetch song info from beat saver and populate it later
                            promisesToResolve.push({
                                promise: getSongDiffInfo(data[i].leaderboard.song.hash, data[i].leaderboard.diffInfo, data[i].leaderboard.leaderboardId, false),
                                song: data[i].leaderboard.song,
                                page
                            })
                        }
                    } catch (e) {
                        // swallow error
                    }
                } else {
                    data[i].acc = getAccFromScore(data[i].score);
                }
            }
        }

        return {
            data,
            enhancePromise: async () => {
                // wait for resolve all song diff info promises
                if (promisesToResolve.length)
                    await Promise.allSettled(promisesToResolve.map(arr => arr.promise)).then(all => {
                        all.forEach(async (result, idx) => {
                            if (result.status === 'fulfilled') {
                                const songInfo = result.value;
                                const song = promisesToResolve[idx].song;

                                if (songInfo) {
                                    song.maxScoreEx = songInfo.maxScore;
                                    song.acc = getAccFromScore(song);
                                }
                            }
                        })

                        return all;
                    })

                return promisesToResolve.length && promisesToResolve[0].page === currentPage
                        ? data
                        : null;
            }
        }
    }

    const getRowIdentifier = row => !!row[sortBy] ? row[sortBy] : null;

    function onInBuiltLeaderboardPageChanged(event) {
        const newPage = opt(event, 'detail.page');
        if (!Number.isFinite(newPage)) return;

        inBuiltLeaderboardPage = newPage;
    }

    $: {
        refreshRows(scores, filterFunc, leaderboardType);
    }

    $: {
        refreshScores(sortBy, min, players, refreshTag);
    }
</script>

<Table {header} {rows} {refreshTag} {itemsPerPage} {pagesDisplayMax} onDataPage={onDataPage} withDetails={true} bind:page={currentPage} rowIdentifierFunc={getRowIdentifier} className="ranking global sspl">
    <span slot="head-col" let:col>{col.label}</span>

    <span slot="body-col" let:key let:row>
        {#if key === 'picture'}
            <Avatar player={row.player}/>
        {:else if key === 'rank'}
            <Rank rank={row.rank}/>
        {:else if key === 'player'}
            <PlayerNameWithFlag player={row.player} on:click={(e) => { e.preventDefault(); navigate(`/u/${row.player.playerId}/scoresaber/recent/1`)}}/>
        {:else if key === 'song'}
            <div class="song-cont">
                <Difficulty diff={row.leaderboard.diffInfo} useShortName={true} reverseColors={true}/>
                <Song song={row.leaderboard.song}>
                    <figure>
                        <div class="songinfo">
                            <span class="name">{row.leaderboard.song.name}</span>
                            <div class="author">{row.leaderboard.song.authorName}
                                <small>{row.leaderboard.song.levelAuthorName}</small>
                            </div>
                        </div>
                    </figure>
                </Song>
            </div>
        {:else if key === 'timeset'}
            <FormattedDate date={row.timeSet}/>
        {:else if key === 'acc'}
            <Value value={row.score.acc} zero="-" suffix="%"/>
        {:else if key === 'pp'}
            <Pp pp="{row.pp}" zero="-"/>
        {/if}
    </span>

    <section slot="details" class="details" let:row>
        <div class="tab">
            <LeaderboardPage leaderboardId={row.leaderboard.leaderboardId}
                         type="friends"
                         page={inBuiltLeaderboardPage}
                         scrollOffset={176}
                         dontNavigate={true} withoutDiffSwitcher={true} withoutHeader={true}
                         on:page-changed={onInBuiltLeaderboardPageChanged}
                         {fixedBrowserTitle} />
        </div>
        
    </section>
</Table>

<style>
    .details {
        padding: 1rem 0;
    }

    :global(.sspl tbody) {
        padding-bottom: 2rem;
        font-size: .95rem;
    }

    :global(.sspl th), :global(.sspl td) {
        padding: .5rem;
    }

    :global(.sspl .picture) {
        padding: .5rem 0;
        width: 1.5rem;
    }

    :global(.sspl thead th.rank) {
        width: 2rem;
    }

    :global(.sspl thead th.player) {
        min-width: 8.2rem;
        max-width: 10rem;
    }

    :global(.sspl tbody td.player .player-name) {
        font-size: inherit !important;
    }

    .song-cont {
        display:flex;
        align-items: center;
    }

    :global(.song-cont figure) {
        margin-left: .5rem;
    }

    :global(.sspl td.song .songinfo) {
        text-align: left;
        font-weight: 500;
    }

    :global(.sspl td.song .songinfo) {
        color: var(--alternate);
    }

    :global(.sspl td.song .songinfo small) {
        font-size: 0.75em;
        color: var(--ppColour);
    }

    :global(.sspl thead th.timeset) {
        width: 9.5rem;
    }

    :global(.sspl thead th), :global(.sspl tbody td.acc), :global(.sspl tbody td.pp) {
        text-align: center;
    }

    :global(.sspl .pp) {
        width: 6rem;
    }

    .tab {
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 1fr;
        overflow: hidden;
    }

    .tab > :global(*) {
        grid-area: 1 / 1 / 1 / 1;
    }
</style>