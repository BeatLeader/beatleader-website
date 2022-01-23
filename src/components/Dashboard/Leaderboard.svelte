<script>
    import LeaderboardPage from '../../pages/Leaderboard.svelte'
    import createBeatSaviorService from '../../services/beatsavior';
    import BeatSaviorDetails from '../BeatSavior/Details.svelte'
    import {LEADERBOARD_SCORES_PER_PAGE} from '../../utils/scoresaber/consts'
    import {PRIORITY} from '../../network/queues/http-queue'

    export let row;
    export let fixedBrowserTitle;

    let inBuiltLeaderboardType = "friends"
    let inBuiltLeaderboardPage = 1;

    function onInBuiltLeaderboardPageChanged(event) {
        const newPage = event.detail.page;
        if (!Number.isFinite(newPage)) return;

        inBuiltLeaderboardPage = newPage;
    }

    function onInBuiltLeaderboardTypeChanged(event) {
        const newType = event.detail.type;
        
        updateInBuiltLeaderboardPage(row.score && row.score.rank ? row.score.rank : null)

        inBuiltLeaderboardType = newType;
    }
    function updateInBuiltLeaderboardPage(rank) {
        if (!rank) {
            inBuiltLeaderboardPage = null;
            return;
        }

        inBuiltLeaderboardPage = Math.floor((rank - 1) / LEADERBOARD_SCORES_PER_PAGE) + 1;
    }

    let beatSaviorService = createBeatSaviorService();
    let beatSavior;

    async function updateBeatSavior() {
        if (!row || !row.score || !row.leaderboard) return;

        await beatSaviorService.refresh(row.player.playerId, false, PRIORITY.FG_LOW);

        const bsData = await beatSaviorService.get(row.player.playerId, row);
        if (!bsData) return;

        if (bsData?.stats)
            ['left', 'right'].forEach(hand => {
            ['Preswing', 'Postswing'].forEach(stat => {
                const key = `${hand}${stat}`;
                if (!bsData?.stats?.[key])
                bsData.stats[key] = bsData?.trackers?.accuracyTracker?.[key] ?? null;
            })
            })

        const acc = bsData?.trackers?.scoreTracker?.rawRatio;
        if (acc) row.score.acc = acc * 100;

        const percentage = bsData?.trackers?.scoreTracker?.modifiedRatio;
        if (percentage) row.score.percentage = percentage * 100;

        row.beatSavior = bsData;
        beatSavior = bsData;
    }

    $: updateBeatSavior()
</script>

<div>
    {#if beatSavior}
    <div class="tab">
        <BeatSaviorDetails playerId={row.player.playerId} {beatSavior} leaderboard={row.leaderboard} noHistory={false}/>
    </div>
    {/if}

<LeaderboardPage leaderboardId={row.leaderboard.leaderboardId}
                type={inBuiltLeaderboardType}
                page={inBuiltLeaderboardPage}
                scrollOffset={176}
                dontNavigate={true} withoutDiffSwitcher={true} withoutHeader={true} dontChangeType={true} iconsInInfo={true} noReplayInLeaderboard={true} autoScrollToTop={false}
                hasReplay={row.pp != 0 && row.score.rank <= 500}
                on:page-changed={onInBuiltLeaderboardPageChanged} 
                on:type-changed={onInBuiltLeaderboardTypeChanged}
                {fixedBrowserTitle}
                higlightedScore={row} />
</div>
