<script>
	import {navigate} from 'svelte-routing';
	import Badge from '../Common/Badge.svelte';
	import createBadgeUtils from '../Common/utils/badge';
    
	export let clan = null;
    export let clanRankingContested = null;

	const badgeUtils = createBadgeUtils();
</script>


<div class="status-and-type">
    {#if clanRankingContested}
        <div style=" --clan-color: #000000" class="captor-clan captor-clan-outline">
            <p class="captured-by">
                Captured by:
            </p>
			<Badge
				label="&#9876 CONTESTED &#9876"
				onlyLabel={true}
				fluid={true}
				color={badgeUtils.invertColor('#000000')}
				bgColor={'var(--dimmed)'}
				title="Set a score on this map to break the tie and capture it for your clan!" />
        </div>
    {:else if (clan ?? null) === null}
        <div style=" --clan-color: #000000" class="captor-clan captor-clan-outline">
            <p class="captured-by">
                Captured by:
            </p>
			<Badge
				label="UNCAPTURED"
				onlyLabel={true}
				fluid={true}
				color={badgeUtils.invertColor('#000000')}
				bgColor={'var(--dimmed)'}
				title="Set a score on this map to capture it for your clan!" />
        </div>
    {:else}
        <div style=" --clan-color: {clan ?? '#000000'}" class="captor-clan captor-clan-outline">
            <p class="captured-by">
                Captured by:
            </p>
            <a href={`/clan/${clan?.tag}`} on:click|stopPropagation={() => navigate(`/clan/${clan?.tag}`)}>
                <Badge
                    label={clan?.tag ?? '???'}
                    onlyLabel={true}
                    fluid={true}
                    color={badgeUtils.invertColor(clan?.color ?? '#000000')}
                    bgColor={clan?.color ?? 'var(--dimmed)'}
                    title="Set a score on this map to help capture it for your clan!" />
            </a>
        </div>
    {/if}
</div>


<style>
	.status-and-type {
		display: flex;
		gap: 0.6em;
	}

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
