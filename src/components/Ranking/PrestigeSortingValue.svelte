<script>
	import prestigeDescriptionsStore from '../../stores/beatleader/prestige-descriptions';

	export let value;
</script>

{#if $prestigeDescriptionsStore}
	<div class="prestige-sorting-value">
		<div class="prestige-value-container">
			<span class="prestige-icon" title="Prestige {value.prestige}"
				><img src={$prestigeDescriptionsStore.find(prestige => prestige.level === value.prestige)?.bigIcon} alt="Prestige" /></span>
		</div>
		<div class="level-value-container">
			<span class="level-value">lvl {value.level}</span>
		</div>
	</div>
{/if}

<style>
	.prestige-sorting-value {
		display: grid;
		width: 6em;
		grid-template-columns: 2.65em 3.5em;
	}

	.prestige-icon {
		display: block;
		width: 2em;
		height: 2em;
		margin-bottom: -0.1em;
		object-fit: contain;
	}

	.level-value-container {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		height: 100%;
	}
</style>
