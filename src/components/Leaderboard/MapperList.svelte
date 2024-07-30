<script>
	import Mapper from './Mapper.svelte';

	export let song;
</script>

{#if song.mappers?.length}
	<div class="mappers-list">
		{#if song.mappers.length > 1}
			<small class="mapper-title" title={song.levelAuthorName}>Mappers:</small>
		{:else}
			<small class="mapper-title" title={song.levelAuthorName}>Mapper:</small>
		{/if}
		{#each song.mappers as mapper}
			<Mapper {mapper} />
		{/each}
	</div>
{:else}
	<small class="level-author" title="Mapper">Mapped by: {song.levelAuthorName}</small>
{/if}

<style>
	.level-author {
		color: var(--alternate);
		font-size: 1.1em;
	}
	.mapper-title {
		color: rgba(255, 255, 255, 0.797);
		font-size: 1.1em;
	}
</style>
