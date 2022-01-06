<script>
    import LeaderboardPage from '../../pages/Leaderboard.svelte'

    export let row;
    export let fixedBrowserTitle;

    let inBuiltLeaderboardType = "friends"
    let inBuiltLeaderboardPage = null;

    function onInBuiltLeaderboardPageChanged(event) {
        const newPage = event.detail.page;
        if (!Number.isFinite(newPage)) return;

        inBuiltLeaderboardPage = newPage;
    }

    function onInBuiltLeaderboardTypeChanged(event) {
        const newType = event.detail.type;

        inBuiltLeaderboardType = newType;
    }
</script>

<LeaderboardPage leaderboardId={row.leaderboard.leaderboardId}
                         type={inBuiltLeaderboardType}
                         page={inBuiltLeaderboardPage}
                         scrollOffset={176}
                         dontNavigate={true} withoutDiffSwitcher={true} withoutHeader={true}
                         on:page-changed={onInBuiltLeaderboardPageChanged} 
                         on:type-changed={onInBuiltLeaderboardTypeChanged}
                         {fixedBrowserTitle} />