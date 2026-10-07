<script>
	import SkillTriangleChart from '../components/Player/Charts/SkillTriangleChart.svelte';

	export let playerId;
</script>

<div class="skill-triangle-history">
	<div class="header">
		<i class="skilltriangle-icon"></i>
		<span class="big-title">Skill Triangle</span>
	</div>

	<SkillTriangleChart {playerId} animate={true} />
</div>

<style>
	.skill-triangle-history {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-top: -2em;
		background-color: #131313;
		width: 100%;
	}

	.header {
		margin-top: 2em;
	}

	.big-title {
		color: white;
		font-size: 1.4em;
	}

	.skilltriangle-icon {
		width: 2em;
		height: 2em;
		display: inline-block;
		margin-bottom: -0.4em;
	}

	.skill-triangle-history :global(.triangle-and-slider) {
		flex-direction: row;
		align-items: normal;
		gap: 0;
		width: 100%;
		padding: 2em;
	}

	.skill-triangle-history :global(.triangle-container) {
		min-width: min(80%, 20em);
	}
</style>
