<script>
	import {link} from 'svelte-routing';
	import {difficultyLabel, entityImage, entityName, entityUrl} from './utils';

	export let entity = null;
	export let fallback = '';

	$: map = entity?.map;
	$: scorePlayer = map && entity.player;
	$: url = entityUrl(entity);
	$: external = url?.startsWith('http');
	$: details = map
		? [map.mapper, map.difficulty && difficultyLabel(map.difficulty), map.stars && `${map.stars.toFixed(2)}★`]
				.filter(Boolean)
				.join(' · ')
		: '';
</script>

{#if entity}
	<span class="entity">
		<img class="entity-image" class:round={!map} src={entityImage(entity)} alt="" loading="lazy" />
		<span class="names">
			{#if url}
				<a class="name" href={url} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} use:link>
					{entityName(entity)}
				</a>
			{:else}
				<span class="name">{entityName(entity)}</span>
			{/if}
			{#if details}
				<span class="details">
					{details}
					{#if scorePlayer}
						· by <a href="/u/{scorePlayer.id}" use:link>{scorePlayer.name}</a>
					{/if}
				</span>
			{/if}
		</span>
	</span>
{:else}
	<span class="missing">{fallback}</span>
{/if}

<style>
	.entity {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		min-width: 0;
	}

	.entity-image {
		width: 2em;
		height: 2em;
		flex-shrink: 0;
		object-fit: cover;
		border-radius: 4px;
	}

	.entity-image.round {
		border-radius: 50%;
	}

	.names {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.name,
	.details {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.name {
		color: var(--textColor);
	}

	.details {
		font-size: 0.8em;
		color: var(--faded);
	}

	.details a {
		color: var(--alternate);
	}

	.missing {
		color: var(--faded);
	}
</style>
