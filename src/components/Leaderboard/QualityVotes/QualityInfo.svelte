<script>
	import createAccountStore from '../../../stores/beatleader/account';
	import createLeaderboardService from '../../../services/beatleader/leaderboard';
	import QualityVoting from './QualityVoting.svelte';
	import Commentary from '../Commentary.svelte';
	import Error from '../../Common/Error.svelte';

	export let leaderboardId;
	export let showCommentary = false;

	const account = createAccountStore();
	const leaderboardService = createLeaderboardService();

	let qualification;
	let isLoading = false;
	let error = null;

	async function fetchQualification(leaderboardId) {
		if (!leaderboardId?.length) return;

		try {
			isLoading = true;
			error = null;

			const data = await leaderboardService.fetchLeaderboardPage(leaderboardId, 1, {count: 1});

			qualification = data?.leaderboard?.qualification ?? null;
		} catch (err) {
			error = err;
		} finally {
			isLoading = false;
		}
	}

	$: currentPlayerId = $account?.id;
	$: isAdmin = $account?.player?.playerInfo?.role?.includes('admin');
	$: isNQT = isAdmin || $account?.player?.playerInfo?.role?.includes('qualityteam');

	$: fetchQualification(leaderboardId);
</script>

<section>
	{#if error}
		<Error {error} />
	{/if}

	{#if isLoading}Loading...{/if}

	{#if isNQT && qualification}
		<QualityVoting {qualification} {isNQT} {currentPlayerId} />
		{#if showCommentary}
			<Commentary {isNQT} {qualification} {currentPlayerId} />
		{/if}
	{/if}
</section>

<style>
	section {
		margin: 1rem 0;
		max-width: 35rem;
	}
</style>
