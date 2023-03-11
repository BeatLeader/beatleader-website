<script>
	import {createEventDispatcher} from 'svelte';
	import {clickOutside} from '../../svelte-utils/actions/click-outside';

	const dispatch = createEventDispatcher();

	export let items = [];
	export let shown = false;
	export let noItems = null;
</script>

<div class="dropdown-menu" role="menu" class:shown use:clickOutside={{callback: () => (shown = false), parent: '.nav-button'}}>
	<div class="dropdown-content">
		{#if items && items.length}
			{#each items as item}
				{#if item?.class === 'dropdown-divider'}
					<hr class="dropdown-divider" />
				{:else}
					<div class="dropdown-item" on:click={() => dispatch('select', item)}>
						<slot name="row" {item}>
							{item}
						</slot>
					</div>
				{/if}
			{/each}
		{:else if noItems}
			<div class="menu-label">{noItems}</div>
		{/if}
	</div>
</div>

<style>
</style>
