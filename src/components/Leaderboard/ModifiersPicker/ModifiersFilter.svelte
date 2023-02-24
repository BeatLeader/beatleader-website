<script>
	import {createEventDispatcher} from 'svelte';
	import ModifiersPicker from './ModifiersPicker.svelte';

	import {getContext} from 'svelte';
	const {open, close} = getContext('simple-modal');

	export let selected = '';
	export let id = '';

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
				dispatch('change', {value: newModifiers, id});
				close();
			},
			oncancel: () => {
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
</style>
