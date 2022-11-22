<script>
	import {navigate} from 'svelte-routing';
	import Badge from '../Common/Badge.svelte';

	export let player;

	function invertColor(hex) {
		if (hex.indexOf('#') === 0) {
			hex = hex.slice(1);
		}
		// convert 3-digit hex to 6-digits.
		if (hex.length === 3) {
			hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
		}
		if (hex.length === 6) {
			hex = hex + 'FF';
		}
		var r = parseInt(hex.slice(0, 2), 16),
			g = parseInt(hex.slice(2, 4), 16),
			b = parseInt(hex.slice(4, 6), 16),
			a = parseInt(hex.slice(6, 8), 16);
		// https://stackoverflow.com/a/3943023/112731
		return r * 0.299 + g * 0.687 + b * 0.114 > 186 && a > 128 ? '#000000' : '#FFFFFF';
	}

	$: clans = player?.clans ?? null;
</script>

{#if clans}
	<span class="clan-badges">
		{#each clans as clan (clan.tag)}
			<a href={`/clan/${clan?.tag}`} on:click|stopPropagation={() => navigate(`/clan/${clan?.tag}`)}>
				<Badge
					label={clan?.tag ?? '???'}
					onlyLabel={true}
					fluid={true}
					color={invertColor(clan?.color ?? '#000000')}
					bgColor={clan?.color ?? 'var(--dimmed)'}
					title="Go to clan profile" />
			</a>
		{/each}
	</span>
{/if}

<style>
	.clan-badges {
		margin-left: 0.5em;
		font-size: 1rem;
		padding: 0 !important;
		font-weight: bold;
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
