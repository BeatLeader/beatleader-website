<script>
	import RangeSlider from 'svelte-range-slider-pips';
	import {userDescriptionForModifier} from '../../utils/beatleader/format';
	import {createEventDispatcher} from 'svelte';

	export let modifiers;

	const dispatch = createEventDispatcher();
</script>

<div class="qualification-description">
	{#each Object.keys(modifiers) as modifier}
		{#if modifier != 'modifierId'}
			<label>{userDescriptionForModifier(modifier.toUpperCase())}:</label>
			<RangeSlider
				min={-100}
				max={100}
				step={1}
				values={[modifiers[modifier] * 100]}
				float
				hoverable
				pips
				pipstep={10}
				all="label"
				on:change={event => {
					modifiers[modifier] = event.detail.values[0] / 100;
					dispatch('modifiersUpdated', modifiers);
				}} />
		{/if}
	{/each}
</div>

<style>
	.qualification-description {
		display: flex;
		grid-gap: 0.4em;
		align-items: left;
		flex-direction: column;
		width: 100%;
	}
</style>
