<script>
	import {navigate} from 'svelte-routing';
	import {onMount} from 'svelte';

	onMount(async () => {
		navigate('/dashboard', {replace: true});
	});
</script>
