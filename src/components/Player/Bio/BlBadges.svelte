<script>
	import {fade} from 'svelte/transition';

	export let badges;
</script>

{#if badges}
	<div class="bl-badges" transition:fade|global={{duration: 500}}>
		{#each badges as badge (badge.src)}
			{#if badge.link}
				<a class="badge-link" href={badge.link}>
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
		gap: 0.05em 0.5em;
		margin: 0.5em 0;
		justify-content: center;
		width: 100%;
		flex-wrap: wrap;
	}

	.bl-badges img {
		height: 41px;
	}

	.badge-link {
		display: contents;
	}

	@media (max-width: 768px) {
		.bl-badges {
			justify-content: center;
		}
	}
</style>
