<script>
	import Value from './Value.svelte';
	import {onMount} from 'svelte';

	export let value = 0;
	export let digits = 2;

	let resolvedValue = value;
	let unsubscribe = null;
	function resolveValue(value) {
		if (value && value.subscribe) {
			unsubscribe = value.subscribe(value => (resolvedValue = value));
		} else {
			resolvedValue = value;
		}
	}

	onMount(() => {
		return () => {
			if (unsubscribe) unsubscribe();
		};
	});

	$: resolveValue(value);
	$: minValue = Math.pow(10, -digits - 1);
	$: absoluteValue = Math.abs(value);

	$: mainClass = resolvedValue ? (resolvedValue > minValue ? 'inc' : resolvedValue < -minValue ? 'dec' : 'zero') : '';
</script>

<span class={mainClass}>
	{#if value > 0}
		<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
			><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7l4-4m0 0l4 4m-4-4v18" /></svg>
	{:else if value < 0}
		<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
			><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 17l-4 4m0 0l-4-4m4 4V3" /></svg>
	{/if}

	<Value value={absoluteValue} zero="" {digits} />
</span>

<style>
	span {
		display: inline-flex;
		justify-content: flex-start;
		align-items: center;
	}

	svg {
		width: 1em;
		height: 1em;
	}
</style>
