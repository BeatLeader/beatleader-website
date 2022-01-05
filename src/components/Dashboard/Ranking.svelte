<script>
    import {onMount} from 'svelte';
    import {navigate} from "svelte-routing";
    import Rank from '../Common/Rank.svelte';
    import PlayerNameWithFlag from '../Common/PlayerNameWithFlag.svelte';
    import Pp from '../Score/Pp.svelte';
    import Value from '../Common/Value.svelte';
    import Table from '../Common/Table.svelte';
    import Avatar from "../Common/Avatar.svelte";
    import Change from '../Common/Change.svelte'

    import {PLAYERS_PER_PAGE} from "../../utils/scoresaber/consts";
    import {formatNumber} from "../../utils/format";
    import { getPlayerInfo } from '../../utils/players';

    export let players;
    export let overridePlayersPp = {};
    export let itemsPerPage = 25;
    export let filterFunc = null;
    export let refreshTag = null;

    const DB_FETCH_DIFF = 14;

    players.sort((a,b) => b.playerInfo.pp - a.playerInfo.pp);

    const header = [
        {label: '', key: 'picture', className: 'picture'},
        {label: '#', key: 'rank', className: 'rank'},
        {label: 'player', key: 'player', className: 'player'},
        {label: 'pp', key: 'pp', className: 'pp'},
        {label: 'change', key: 'weeklyDiff', className: 'diff'}
    ]
    let rows = [];

    // async function addPlayersHistory() {
    //     const DIFF_DAYS = 7;
    //     const timestampDiffAgo = toSSTimestamp(daysAgo(DIFF_DAYS));
    //     const dbFetchTimestamp = toSSTimestamp(daysAgo(DIFF_DAYS + DB_FETCH_DIFF));
    //     const playersHistory = (await getAllPlayersHistory(new Date(dbFetchTimestamp), new Date(timestampDiffAgo)))
    //      .reduce((cum, item) => {
    //          if (!cum[item.playerId]) cum[item.playerId] = {};

    //          cum[item.playerId][item.timestamp.getTime()] = item;

    //          return cum;
    //      }, {});

    //     ranking = ranking.map(p => {
    //         const historicalTimestamp = playersHistory[p.id] ? getFirstNotNewerThan(timestampDiffAgo, Object.keys(playersHistory[p.id])) : null;

    //         return {...p, prevPp: historicalTimestamp && p.pp !== playersHistory[p.id][historicalTimestamp].pp ? playersHistory[p.id][historicalTimestamp].pp : null}
    //     });
    // }

    // $: if (players && refreshTag) {
    //     ranking = players
    //             .map(player => {
    //                 if (overridePlayersPp[player.id] && overridePlayersPp[player.id].pp) {
    //                     player.pp = overridePlayersPp[player.id].pp;
    //                 }

    //                 const {weeklyDiff:change} = player;

    //                 return {...player, change, weeklyDiff_className: 'diff ' + (change ? (change > 0 ? 'inc' : 'dec') : '')};
    //             })
    //             .sort((a,b) => b.pp - a.pp) // sort it again after override
    //             .filter(p => !filterFunc || filterFunc(p))
    //             .map((player, idx) => ({...player, name: player.name}))
    //     ;
    // }

    // $: addPlayersHistory(players, refreshTag, overridePlayersPp, filterFunc);
</script>

{#if players}
<Table {header} rows={players} {itemsPerPage} pagesDisplayMax={7} className="ranking global sspl">
    <span slot="head-col" let:col>{col.label}</span>

    <span slot="body-col" let:key let:rowIdx let:row>
        {#if key === 'picture'}
            <Avatar player={row} />
        {:else if key === 'rank'}
            <Rank rank={rowIdx+1} url={'/global/' + encodeURIComponent( Math.ceil(row.rank / PLAYERS_PER_PAGE))} />
        {:else if key === 'player'}
            <PlayerNameWithFlag player={row} on:click={(e) => { e.preventDefault(); navigate(`/u/${row.playerId}/scoresaber/recent/1`)}}/>
        {:else if key === 'pp'}
            <Pp pp="{row.playerInfo.pp}" zero={formatNumber(0)} inline={true} />
        {:else if key === 'weeklyDiff'}
            <Change value={(() => {let history = row.playerInfo.rankHistory; return (history.length > 7 ? parseInt(history[history.length - 7]) - parseInt(history[history.length - 1]) : null)})()} digits={0} />
        {/if}
    </span>
</Table>
{/if}

<style>
    :global(.sspl .picture) {
        padding: .5rem 0;
        width: 1.5rem;
    }
</style>

