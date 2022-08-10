<script>
	import {mapTypeListFromMask} from '../../utils/beatleader/format';

	import {dateFromUnix, formatDateRelative, getTimeStringColor} from '../../utils/date';

	export let type;
	export let cram = false;

	$: typeList = mapTypeListFromMask(type);
</script>

{#if type}
	{#each typeList as type, idx}
		<span class="type {cram ? 'cram' : ''}" style="color: white; background-color: {type.color}; " title={type.title} on:click>
			<span class="icon">
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
		display: inline-block;
		font-weight: 600;
		padding: 0 2px;
		min-width: 1.5em;
		max-height: 1.5em;
		border-radius: 2px;
		margin-left: 0.5em;
	}

	.cram {
		padding: 0;
		margin-left: 0;
	}

	.icon {
		height: 1rem !important;
		width: 1rem !important;
	}
</style>
