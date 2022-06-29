<script>
	export let value = [];

	$: if (!Array.isArray(value)) value = [];

	$: console.log(value)
</script>

TODO: {value?.join(', ') ?? 'no country selected'}
