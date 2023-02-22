<script>
	import {createEventDispatcher} from 'svelte';
	import ModifiersPicker from './ModifiersPicker.svelte';

	import {getContext} from 'svelte';
	const {open, close} = getContext('simple-modal');

	export let selected = '';

	const dispatch = createEventDispatcher();

	let colorForM = 'white';
	function updateColor(modifiers) {
		if (!modifiers) {
			colorForM = 'white';
			return;
		}
		if (modifiers.includes('none')) {
			colorForM = 'red';
		} else if (modifiers.length) {
			if (modifiers.includes('any')) {
				colorForM = 'blue';
			} else {
				colorForM = 'purple';
			}
		} else {
			colorForM = 'white';
		}
	}

	function onOpen() {
		open(ModifiersPicker, {
			selected,
			onchange: newModifiers => {
				dispatch('change', newModifiers);
				close();
			},
		});
	}

	$: updateColor(selected);
</script>

<div class="filter" title="Filter by modifiers">
	<i style="color: {colorForM}" class={`fas filter-btn fa-m`} on:click={onOpen} on:keypress={onOpen} />
</div>

<style>
	.filter {
		display: inline-block;
		position: relative;
		width: 1.75em;
		height: calc(1em + 0.5em + 2px + 2px);
		overflow: hidden;
		transition: all 300ms ease-out;
		margin-right: 0.25em;
	}

	.filter:not(.open) > .filter-component {
		display: none;
	}

	.filter.open {
		width: 11em;
		overflow: visible;
	}

	.filter > .filter-component {
		position: absolute;
		left: 0;
		bottom: 0;
		width: calc(100% - 1.4em);
		line-height: 1;
		color: var(--textColor);
		background-color: transparent;
		transition: all 300ms ease-out;
		outline: none;
	}

	.filter-btn {
		position: absolute;
		top: 0;
		right: 0;
		width: 1.75em;
		text-align: center;
		padding: 0.4em;
		transition: all 300ms ease-out;
		background-color: var(--dimmed);
		z-index: 1;
		cursor: pointer;
		border-radius: 0.2em;
	}

	.modifiers-list {
		display: grid;
		grid-template-columns: 14em 14em 14em;
		grid-gap: 1em;
	}

	.modifier {
		border-radius: 0.8em;
		background-color: #0000006e;
		position: relative;
		display: flex;
		align-items: center;
		height: 4em;
		cursor: pointer;
	}

	.modifier.selected {
		background: linear-gradient(91deg, #068bbf, transparent);
	}

	.modifier-icon {
		width: 2.5em;
		height: 2.5em;
		margin-left: 0.7em;
	}

	.modifier-title {
		position: absolute;
		top: 0.6em;
		right: 0.5em;
		text-align: right;
		font-weight: 600;
		color: #ffffffde;
		max-width: 70%;
	}

	.switch-container {
		position: absolute;
		right: 1em;
		top: 2em;
		display: flex;
		grid-gap: 1em;
	}

	.reset-button {
		position: absolute;
		bottom: 1em;
	}

	@media screen and (max-width: 768px) {
		.modifiers-list {
			grid-template-columns: 46% 46%;
		}
		.switch-container {
			position: relative;
			margin: 1em;
			top: 0;
		}
	}
</style>
