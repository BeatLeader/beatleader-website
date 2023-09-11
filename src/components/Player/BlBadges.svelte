<script>
	import {fade} from 'svelte/transition';

	export let badges;
</script>

{#if badges}
	<div class="bl-badges" transition:fade|global={{duration: 500}}>
		{#each badges as badge (badge.src)}
			{#if badge.link}
				<a href={badge.link}>
					<img class="clickable" src={badge.src} alt={badge.title} title={badge.title} />
				</a>
			{:else}
				<img src={badge.src} alt={badge.title} title={badge.title} />
			{/if}
		{/each}
	</div>
{/if}

<style>
	.bl-badges {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
	}

	.bl-badges img {
		margin-right: 0.5rem;
		margin-bottom: 0.25rem;
		height: 41px;
	}

	@media (max-width: 768px) {
		.bl-badges {
			margin-top: 0.5rem;
			justify-content: center;
		}
	}
</style>
