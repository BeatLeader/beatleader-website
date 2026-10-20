<script>
	import {getContext} from 'svelte';
	import {NO_VOTE, VOTE_CONTEXT, votePercent} from './votes';

	export let itemId;

	const voteStore = getContext(VOTE_CONTEXT) ?? NO_VOTE;

	function pickTitle(state, picked, full, single) {
		if (!state?.canPick) return picked ? 'Your pick' : '';
		if (picked) return 'Picked, click to unpick';
		if (full) return `You picked ${state.vote.maxChoices} already, unpick one first`;
		return single ? 'Pick this one' : 'Pick this';
	}

	$: state = $voteStore;
	$: option = state?.byItem?.get(itemId) ?? null;
	$: picked = !!option && state.selected.has(option.id);
	$: single = state?.vote?.maxChoices === 1;
	$: full = !!state && !single && state.selected.size >= state.vote.maxChoices;
	$: percent = option?.votes != null ? votePercent(option.votes, state.vote.voterCount) : 0;
	$: title = pickTitle(state, picked, full, single);
</script>

{#if option}
	<div class="vote-cell">
		{#if state.showPicks}
			<button
				class="pick"
				class:single
				class:on={picked}
				class:ghost={!state.canPick && !picked}
				disabled={!state.canPick || (full && !picked)}
				{title}
				aria-pressed={picked}
				on:click|stopPropagation={() => state.toggle(option.id)}>
				{#if picked}<i class="fas fa-check" />{/if}
			</button>
		{/if}
		{#if state.resultsVisible && option.votes != null}
			<div class="tally" title="{option.votes} {option.votes === 1 ? 'vote' : 'votes'}, {percent}% of voters">
				<span class="numbers"><b>{option.votes}</b> <span class="percent">{percent}%</span></span>
				<span class="bar"><span class="fill" style="width: {percent}%" /></span>
			</div>
		{/if}
	</div>
{/if}

<style>
	.vote-cell {
		flex: none;
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.pick {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5em;
		height: 1.5em;
		padding: 0;
		border: 2px solid color-mix(in srgb, var(--textColor, white) 50%, transparent);
		border-radius: 0.35em;
		background: transparent;
		color: white;
		font-size: 0.9em;
		cursor: pointer;
		transition:
			background-color 0.15s,
			border-color 0.15s;
	}

	.pick.single {
		border-radius: 50%;
	}

	.pick:hover:not(:disabled):not(.on) {
		border-color: var(--textColor, white);
		background-color: color-mix(in srgb, var(--textColor, white) 10%, transparent);
	}

	.pick.on {
		border-color: var(--vote-accent, #9b6dff) !important;
		background-color: var(--vote-accent, #9b6dff) !important;
		color: white;
	}

	.pick:disabled {
		cursor: default;
		opacity: 0.5;
	}

	.pick.ghost {
		visibility: hidden;
	}

	.pick.on:disabled {
		opacity: 1;
	}

	.tally {
		display: flex;
		flex-direction: column;
		gap: 0.2em;
		width: 4.2em;
		font-size: 0.85em;
	}

	.numbers {
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}

	.percent {
		opacity: 0.6;
	}

	.bar {
		height: 0.3em;
		border-radius: 1em;
		background-color: color-mix(in srgb, var(--textColor, white) 12%, transparent);
		overflow: hidden;
	}

	.fill {
		display: block;
		height: 100%;
		border-radius: 1em;
		background-color: var(--vote-accent, #9b6dff);
	}

	@media screen and (max-width: 600px) {
		.vote-cell {
			flex-direction: column;
			gap: 0.3em;
		}

		.tally {
			width: 2.8em;
			align-items: center;
			font-size: 0.75em;
		}

		.numbers {
			display: flex;
			flex-direction: column;
			align-items: center;
			line-height: 1.15;
		}

		.bar {
			width: 100%;
		}
	}

	/* Centers icons in the 1.3em box of Button.svelte's global button i rule */
	button i {
		line-height: 1.3em;
		text-align: center;
	}
</style>
