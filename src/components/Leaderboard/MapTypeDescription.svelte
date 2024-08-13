<script>
	import {mapTypeListFromMask} from '../../utils/beatleader/format';

	export let type;
	export let cram = false;

	$: typeList = mapTypeListFromMask(type);
</script>

{#if type}
	{#each typeList as type, idx}
		<span class="type {cram ? 'cram' : ''}" style="color: {type.textColor}; background-color: {type.color}; " title={type.title} on:click>
			<span class="icon {!cram ? 'cram' : ''}">
				<div class={type.icon} title={type.title} />
			</span>
			{#if !cram}
				{type.name}
			{/if}
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

	.cram {
		padding: 0;
		margin-right: 0;
		border-radius: 2px;
		height: 1.5em;
	}

	.icon.cram {
		height: 1rem !important;
		width: 1.5rem !important;
	}

	.icon {
		height: 1rem !important;
		width: 1rem !important;
	}
</style>
