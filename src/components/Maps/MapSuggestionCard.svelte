<script>
	import {createEventDispatcher} from 'svelte';
	import Button from '../Common/Button.svelte';
	import MapCard from './List/MapCard.svelte';

	const dispatch = createEventDispatcher();

	export let map = null;
	export let actionLabel = null;
	export let actionIconFa = null;
	export let actionType = 'primary';
	export let actionTitle = null;
	export let actionDisabled = false;
	export let badges = [];

	function onAction() {
		if (!map || actionDisabled) return;
		dispatch('action', map);
	}
</script>

{#if map}
	<div class="card-shell">
		<div class="card-toolbar">
			{#if badges?.length}
				<div class="badges">
					{#each badges as badge}
						<span class="badge">{badge}</span>
					{/each}
				</div>
			{/if}

			{#if actionLabel}
				<Button
					cls="overlay-action"
					type={actionType}
					label={actionLabel}
					iconFa={actionIconFa}
					title={actionTitle}
					disabled={actionDisabled}
					noMargin={true}
					on:click={onAction} />
			{/if}
		</div>

		<MapCard {map} />
	</div>
{/if}

<style>
	.card-shell {
		position: relative;
	}

	.card-toolbar {
		position: absolute;
		top: 0.6em;
		left: 0.6em;
		right: 0.6em;
		z-index: 8;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.6em;
		pointer-events: none;
	}

	.badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35em;
		pointer-events: none;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		padding: 0.3em 0.65em;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.72);
		backdrop-filter: blur(10px);
		color: white;
		font-size: 0.78em;
		font-weight: 700;
		letter-spacing: 0.02em;
		box-shadow: 0 0.2em 1em rgba(0, 0, 0, 0.25);
	}

	:global(.overlay-action) {
		pointer-events: all;
		height: 2.2em;
		border-radius: 999px !important;
		box-shadow: 0 0.35em 1.2em rgba(0, 0, 0, 0.3);
	}

	@media screen and (max-width: 767px) {
		.card-toolbar {
			top: 0.45em;
			left: 0.45em;
			right: 0.45em;
		}

		.badge {
			font-size: 0.72em;
		}

		:global(.overlay-action) {
			height: 1.95em;
			font-size: 0.9em !important;
		}
	}
</style>
