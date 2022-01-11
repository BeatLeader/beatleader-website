<script>
    import LeaderboardPage from '../../pages/Leaderboard.svelte'
    import {LEADERBOARD_SCORES_PER_PAGE} from '../../utils/scoresaber/consts'

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
</script>

<LeaderboardPage leaderboardId={row.leaderboard.leaderboardId}
                         type={inBuiltLeaderboardType}
                         page={inBuiltLeaderboardPage}
                         scrollOffset={176}
                         dontNavigate={true} withoutDiffSwitcher={true} withoutHeader={true} dontChangeType={true} iconsInInfo={true} noReplayInLeaderboard={true}
                         hasReplay={row.pp != 0 && row.score.rank <= 500}
                         on:page-changed={onInBuiltLeaderboardPageChanged} 
                         on:type-changed={onInBuiltLeaderboardTypeChanged}
                         {fixedBrowserTitle}
                         higlightedPlayerId={row.player.playerId} />