<script>
	export let mapper;
</script>

<div class="mapper-container" style="background-color: {mapper.curator ? 'purple' : mapper.verified ? 'green' : 'black'};">
	<img class="mapper-avatar" src={mapper.avatar} />
	<span>{mapper.name}</span>
</div>

<style>
	.mapper-container {
		display: flex;
		align-items: center;
		gap: 1em;
		border-radius: 8px;
	}

	.mapper-avatar {
		width: 2em;
		height: 2em;
		border-radius: 1em;
	}
</style>
