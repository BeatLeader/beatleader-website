<script>
	import {createEventDispatcher} from 'svelte';
	import {navigate} from 'svelte-routing';

	const dispatch = createEventDispatcher();

	export let label = '';
	let className = null;
	export {className as class};
	export let url = null;
	export let callback = null;
</script>

{#if url?.length || callback}
	<a
		href={url}
		on:click|preventDefault|stopPropagation={() => {
			if (!callback && !url) return;

			callback ? callback() : navigate(url);
			dispatch('click');
		}}
		class={`link-menu-item ${className ?? ''}`}>{label ?? ''}</a>
{/if}

<style>
	.link-menu-item {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		width: 100%;
		color: inherit !important;
	}
</style>
