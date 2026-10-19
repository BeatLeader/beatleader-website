<script>
	import ContentBox from '../Common/ContentBox.svelte';

	export let title;
	export let description = '';
</script>

<ContentBox>
	<div class="header">
		<div>
			<h2>{title}</h2>
			{#if description}
				<p class="description">{description}</p>
			{/if}
		</div>
		<slot name="controls" />
	</div>
	<slot />
</ContentBox>

<style>
	.header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.5em 1em;
		margin-bottom: 1em;
	}

	h2 {
		font-size: 1.25em;
		font-weight: 600;
		margin: 0;
	}

	.description {
		color: var(--faded);
		font-size: 0.9em;
		margin: 0.25em 0 0;
		max-width: 48em;
	}
</style>
