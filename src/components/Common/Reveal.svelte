<script>
	export let openMessage = 'Show';
	export let hideMessage = 'Hide';
	export let hint = null;
	export let opened = false;
</script>

<section>
	<span class="beat-savior-reveal clickable" class:opened on:click={() => (opened = !opened)} title={hint}>
		{#if opened}
			{hideMessage}
		{:else}
			{openMessage}
		{/if}

		<i class="fas fa-chevron-down" />
	</span>

	{#if opened}
		<slot />
	{/if}
</section>

<style>
	.beat-savior-reveal {
		align-self: end;
		cursor: pointer;
	}

	.beat-savior-reveal > i {
		transition: transform 500ms;
		transform-origin: 0.42em 0.5em;
	}

	.beat-savior-reveal.opened > i {
		transform: rotateZ(180deg);
	}
</style>
