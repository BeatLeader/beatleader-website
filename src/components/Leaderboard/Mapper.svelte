<script>
	export let mapper;
	console.log(mapper)
</script>

<div class="mapper-container" style="background-color: {mapper.curator ? '#00bc8c' : mapper.verifiedMapper ? '#7646af' : '#444'};">
	{#if mapper.authorName}
		<i class="fa-solid fa-circle-info map-name-info" title="Missing collaborators were detected. This is the map author name."/>
	{:else}
		<img class="mapper-avatar" src={mapper.avatar} />
	{/if}
	<span>{mapper.name}</span>
	
</div>

<style>
	.mapper-container {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: 0.25em;
		border-radius: 2em;
		padding: 0.3em;
		padding-right: 0.5em;
		color: white;
	}

	.mapper-avatar {
		width: 1.45em;
		aspect-ratio: 1;
		border-radius: 100%;
	}

	.map-name-info {
		color: white;
		opacity: 0.75;
	}
</style>
