<script>
	import {mapTypeListFromMask} from '../../../utils/beatleader/format';

	export let type;

	$: typeList = mapTypeListFromMask(type);
</script>

{#if type}
	{#each typeList as type, idx}
		<span class="type" style="color: {type.textColor}; background-color: {type.color}; " title={type.title} on:click>
			{type.name}
		</span>
	{/each}
{/if}

<style>
	.type {
		display: flex;
		font-weight: 600;
		font-size: 0.8em;
		padding: 1px 2px;
		min-width: 1.5em;
		max-height: 1.5em;
		border-radius: 4px;
		height: 2em;
		align-items: center;
	}
</style>
