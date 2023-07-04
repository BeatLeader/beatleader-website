<script>
	import {fetchJson} from '../../network/fetch';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import AchievementCompact from '../Common/Achievements/AchievementCompact.svelte';
	import ContentBox from '../Common/ContentBox.svelte';

	export let playerId;

	let achievements = [];

	function fetchAchievements(playerId) {
		fetchJson(BL_API_URL + `player/${playerId}/achievements`, {credentials: 'include'})
			.then(clientInfo => {
				achievements = clientInfo.body;
			})
			.catch(err => {
				achievementError = err;
			});
	}

	$: playerId && fetchAchievements(playerId);
</script>

{#if achievements.length > 0}
	<ContentBox>
		<section class="achievements-section">
			<h2>Achievements</h2>
			<div class="achievements-list">
				{#each achievements as achievement}
					<AchievementCompact {achievement} />
				{/each}
			</div>
		</section>
	</ContentBox>
{/if}

<style>
	.achievements-list {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5em;
	}
	.achievements-section {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
</style>
