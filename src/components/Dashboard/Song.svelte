<script>
    import {LEADERBOARD_SCORES_PER_PAGE} from '../../utils/beatleader/consts'

    export let row;
</script>

{#if row}
    <a href="{'/leaderboard/global/' + encodeURIComponent(row.leaderboard.leaderboardId) + "/" + (Math.floor((row.score.rank - 1) / LEADERBOARD_SCORES_PER_PAGE) + 1)}">
        <slot song={row.leaderboard.song}>
            {row.leaderboard.song.songAuthor} - {row.leaderboard.song.name}
        </slot>
    </a>
{/if}