<script>
	import {navigate} from 'svelte-routing';
	import Badge from '../Common/Badge.svelte';
	import createBadgeUtils from '../Common/utils/badge';

	export let player = null;
	export let clan = null;

	const badgeUtils = createBadgeUtils();

	$: playerClans = player?.clans ?? null;
</script>

{#if playerClans}
	<span class="clan-badges">
		{#each playerClans as playerClan (playerClan.tag)}
			<a href={`/clan/${playerClan?.tag}`} on:click|stopPropagation={() => navigate(`/clan/${playerClan?.tag}`)}>
				<Badge
					label={playerClan?.tag ?? '???'}
					onlyLabel={true}
					fluid={true}
					color={badgeUtils.invertColor(playerClan?.color ?? '#000000')}
					bgColor={playerClan?.color ?? 'var(--dimmed)'}
					title="Go to clan profile" />
			</a>
		{/each}
	</span>
{:else if clan}
	<span class="clan-badges">
		<a href={`/clan/${clan?.tag}`} on:click|stopPropagation={() => navigate(`/clan/${clan?.tag}`)}>
			<Badge
				label={clan.tag ?? '???'}
				onlyLabel={true}
				fluid={true}
				color={badgeUtils.invertColor(clan.color ?? '#000000')}
				bgColor={clan?.color ?? 'var(--dimmed)'}
				title="Set a score on this map to help capture it for your clan!" />
		</a>
	</span>
{/if}


<style>
	.clan-badges {
		margin-left: 0.5em;
		font-size: 1rem;
		padding: 0 !important;
		font-weight: bold;
		min-width: fit-content;
	}

	:global(.clan-badges span.label) {
		font-weight: bold;
	}

	.clan-badges :global(a > *) {
		margin-bottom: 0 !important;
		margin-right: 0.25em !important;
		padding: 0 !important;
		font-weight: bold;
		width: min-content !important;
	}
	.clan-badges :global(a > *:last-child) {
		margin-right: 0 !important;
	}

	@media screen and (max-width: 300px) {
		.clan-badges {
			display: none;
		}
	}
</style>
