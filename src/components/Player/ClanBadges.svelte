<script>
	import {dndzone} from 'svelte-dnd-action';
	import {navigate} from 'svelte-routing';
	import {flip} from 'svelte/animate';
	import Badge from '../Common/Badge.svelte';
	import createBadgeUtils from '../Common/utils/badge';

	export let player = null;
	export let clan = null;
	export let editModel = null;
	export let highlightMain = false;

	const badgeUtils = createBadgeUtils();

	var clans = null;

	function initClans(player) {
		clans = player?.clans ?? null;
	}

	function handleDndConsider(e) {
		clans = e.detail.items;
	}
	function handleDndFinalize(e) {
		clans = e.detail.items;
		editModel.data.clanOrder = clans.map(c => c.tag).join(',');
	}

	$: initClans(player);
</script>

{#if clans}
	{#if editModel}
		<span
			use:dndzone={{items: clans, flipDurationMs: 300}}
			on:consider={handleDndConsider}
			on:finalize={handleDndFinalize}
			class="clan-badges">
			{#each clans as clan, idx (clan.id)}
				<a
					class="change-wobble clan-tag {idx == 0 ? 'main-clan' : ''}"
					href={`/clan/${clan?.tag}`}
					animate:flip={{duration: 300}}
					on:click|stopPropagation>
					<Badge
						label={(highlightMain && idx == 0 ? '🏠' : '') + clan?.tag ?? '???'}
						onlyLabel={true}
						fluid={true}
						color={badgeUtils.invertColor(clan?.color ?? '#000000')}
						bgColor={clan?.color ?? 'var(--dimmed)'}
						style="animation-delay: -.{Math.round(Math.random() * 40)}s; animation-duration: .{20 + Math.round(Math.random() * 30)}s"
						title={(highlightMain && idx == 0 ? 'Main clan. ' : '') + 'Change clan order'} />
				</a>
			{/each}
		</span>
	{:else}
		<span class="clan-badges">
			{#each clans as clan, idx (clan.tag)}
				<a
					class="clan-tag {idx == 0 ? 'main-clan' : ''}"
					href={`/clan/${clan?.tag}`}
					on:click|stopPropagation={() => navigate(`/clan/${clan?.tag}`)}>
					<Badge
						label={(highlightMain && idx == 0 ? '🏠' : '') + clan?.tag ?? '???'}
						onlyLabel={true}
						fluid={true}
						color={badgeUtils.invertColor(clan?.color ?? '#000000')}
						bgColor={clan?.color ?? 'var(--dimmed)'}
						title={(highlightMain && idx == 0 ? 'Main clan. ' : '') + 'Go to clan profile'} />
				</a>
			{/each}
		</span>
	{/if}
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

	.change-wobble {
		opacity: 1;
		margin: 0.5em;
	}

	.clan-tag {
		white-space: nowrap;
	}

	:global(.clan-badges .change-wobble .badge:nth-child(2n)) {
		animation-name: keyframes1;
		animation-iteration-count: infinite;
		transform-origin: 50% 10%;
		cursor: grab;
		transform: scale(100%);
	}

	:global(.clan-badges .change-wobble .badge:nth-child(2n-1)) {
		animation-name: keyframes2;
		animation-iteration-count: infinite;
		animation-direction: alternate;
		transform-origin: 30% 5%;
		cursor: grab;
		transform: scale(100%);
	}

	@keyframes keyframes1 {
		0% {
			transform: rotate(-1deg);
			animation-timing-function: ease-in;
		}

		50% {
			transform: rotate(1.5deg);
			animation-timing-function: ease-out;
		}
	}

	@keyframes keyframes2 {
		0% {
			transform: rotate(1deg);
			animation-timing-function: ease-in;
		}

		50% {
			transform: rotate(-1.5deg);
			animation-timing-function: ease-out;
		}
	}

	@media screen and (max-width: 300px) {
		.clan-badges {
			display: none;
		}
	}
</style>
