<script>
	import Badge from '../Common/Badge.svelte';
	import Skeleton from '../Common/Skeleton.svelte';
	import {createEventDispatcher} from 'svelte';
	import DailyImprovementBadge from '../Common/DailyImprovementBadge.svelte';

	export let stats;
	export let skeleton = false;

	const dispatch = createEventDispatcher();
</script>

{#if stats}
	<div class="badges has-text-centered-mobile">
		{#each stats as stat}
			{#key stat.label}
				{#if stat.key == 'dailyImprovements'}
					<DailyImprovementBadge {...stat} on:click={() => dispatch('click', stat)} />
				{:else}
					<Badge {...stat} on:click={() => dispatch('click', stat)} />
				{/if}
			{/key}
		{/each}
	</div>
{:else if skeleton}
	<div class="badges has-text-centered-mobile skeleton">
		{#each Array(5).fill(0) as stat}
			<span class="badge"><Skeleton height="1.5em" /></span>
		{/each}
	</div>
{/if}

<style>
	.badges.skeleton .badge {
		display: inline-block;
		width: 12em;
		margin-right: 0.5em;
		margin-bottom: 0.5em;
	}

	.badges :global(.badge .value .prev.inc),
	.badges :global(.badge .value .prev.dec) {
		color: inherit !important;
	}
</style>
