<script>
	import ContentBox from '../Common/ContentBox.svelte';
	import SongScore from './SongScore.svelte';

	export let pinnedScores;
	export let playerId;
	export let modifiers;
</script>

{#if pinnedScores?.length}
	<ContentBox>
		<section class="pinned-scores">
			<h2>Pinned scores</h2>

			{#each pinnedScores as songScore, idx ((songScore?.id ?? '') + (songScore?.score?.id ?? ''))}
				<div class="score">
					{#if songScore?.score?.metadata?.description?.length}
						<h3>{songScore.score.metadata.description}</h3>
					{/if}

					<SongScore
						{playerId}
						{songScore}
						{idx}
						modifiersStore={modifiers}
						service="beatleader"
						icons={['bs', 'replay', 'pin', 'pin-service']} />
				</div>
			{/each}
		</section>
	</ContentBox>
{/if}

<style>
	.pinned-scores .score {
		padding: 1em 0;
	}

	.pinned-scores h2 {
		font-size: 1.125em;
	}

	.pinned-scores h3 {
		font-size: 0.875em;
		margin-top: 1em;
		margin-bottom: 0.5em;
	}

	.pinned-scores .score :global(.score-in-list) {
		border-bottom: none !important;
	}
</style>
