<script>
	import createPlayerService from '../services/beatleader/player';
	import {SsrHttpNotFoundError, SsrHttpUnprocessableEntityError} from '../network/errors';
	import Profile from '../components/Player/Profile.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';

	export let playerId;

	const playerService = createPlayerService();

	let playerData = null;
	let error = null;

	async function fetchPlayer(playerId) {
		try {
			playerData = await playerService.fetchHydratedPlayer(playerId);
		} catch (err) {
			error = err;
		}
	}

	$: fetchPlayer(playerId);
	$: isLoading = !playerData && !error;
</script>

<section class="align-content">
	<article class="page-content">
		{#if error instanceof SsrHttpNotFoundError || error instanceof SsrHttpUnprocessableEntityError}
			<ContentBox>
				<p class="error">Player not found.</p>
			</ContentBox>
		{:else}
			<Profile {playerData} {isLoading} {error} skeleton={isLoading} clanEffects={false} />
		{/if}
	</article>
</section>

<style>
	.align-content {
		display: flex;
		justify-content: center;
	}

	.page-content {
		max-width: 65em;
		width: 100%;
		overflow-x: hidden;
	}
</style>
