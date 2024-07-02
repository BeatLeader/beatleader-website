<script>
	import createFailedScoresStore from '../../stores/beatleader/failed-scores';
	import Pager from '../Common/Pager.svelte';
	import FailedScore from './FailedScore.svelte';
	import createAccountStore from '../../stores/beatleader/account';

	function onFailedScoresPageChange(event) {
		const page = (event?.detail?.page ?? 0) + 1;

		failedScores.fetchScores(page);
	}

	const failedScores = createFailedScoresStore();
	const account = createAccountStore();

	$: failedScores.refresh();
	$: isAdmin = $account?.player?.playerInfo?.role?.includes('admin');

	$: failedScoresPage = $failedScores?.metadata?.page;
	$: totalFailedScores = $failedScores?.metadata?.total;
	$: failedScoresArray = $failedScores?.scores;
</script>

{#if failedScoresArray && failedScoresArray.length}
	<div class="song-scores failed-scores grid-transition-helper">
		{#each failedScoresArray as songScore, idx (songScore?.score?.id)}
			<FailedScore store={failedScores} {songScore} {idx} {isAdmin} />
		{/each}
	</div>
	{#if Number.isFinite(failedScoresPage) && (!Number.isFinite(totalFailedScores) || totalFailedScores > 0)}
		<Pager
			totalItems={totalFailedScores}
			itemsPerPage={3}
			itemsPerPageValues={null}
			currentPage={failedScoresPage - 1}
			on:page-changed={onFailedScoresPageChange} />
	{/if}
{/if}
