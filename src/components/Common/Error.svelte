<script>
	export let error;
	export let withTrace = false;

	function getMessage(error) {
		return error && error.toString ? error.toString() : 'Unknown error';
	}

	function getStack(error) {
		return error.stack;
	}

	$: message = getMessage(error);
	$: stack = withTrace ? getStack(error) : null;
</script>

{#if message}
	<span>{message}</span>
{/if}
{#if stack}
	{#each stack.split('\n') as line}
		<div>{line}</div>
	{/each}
{/if}

<style>
	span {
		font-weight: 500;
		color: var(--decrease, 'red');
	}
</style>
