<script>
	import {createEventDispatcher, onDestroy, onMount} from 'svelte';

	const dispatch = createEventDispatcher();

	onMount(() => dispatch('spawn'));
	onDestroy(() => dispatch('destroy'));
</script>

<slot/>
