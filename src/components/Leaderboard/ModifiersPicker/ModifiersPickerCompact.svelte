<script>
	import {ModifiersList} from '../../../utils/beatleader/format';
	import {deepClone} from '../../../utils/js';
	import Button from '../../Common/Button.svelte';
	import Select from '../../Settings/Select.svelte';

	export let selected = '';
	export let onchange;
	export let oncancel;

	let include = true;
	let exclusive = true;
	let modifiers = deepClone(ModifiersList.filter(m => !m.hideInFilter));
	let selectedModifiers = [];
	let hasState = false;

	function setAllModifiersSelected(selected) {
		modifiers.forEach(m => (m.selected = selected));
		modifiers = modifiers;
	}

	function resetState() {
		include = true;
		exclusive = true;
		setAllModifiersSelected(false);
	}

	function selectDefault(selected) {
		resetState();

		if (!selected) return;

		var elements = selected.split(',').filter(Boolean);

		if (elements.includes('none')) {
			include = false;
			exclusive = false;
			setAllModifiersSelected(true);
			return;
		}

		elements.forEach(element => {
			var modifier = modifiers.find(m => m.id == element);
			if (modifier) {
				modifier.selected = true;
			}

			if (element == 'not') {
				include = false;
			}

			if (element == 'any') {
				exclusive = false;
			}
		});

		modifiers = modifiers;
	}

	function modifiersUpdated() {
		var selectedModifiers = modifiers.filter(m => m.selected).map(m => m.id);
		if (!include && !exclusive && selectedModifiers.length == modifiers.length) {
			onchange('none');
			return;
		}

		if (!exclusive) {
			selectedModifiers.push('any');
		}

		if (!include) {
			selectedModifiers.push('not');
		}

		onchange(selectedModifiers.join(','));
	}

	function reset() {
		resetState();
		modifiersUpdated();
	}

	function selectAll() {
		setAllModifiersSelected(true);
		modifiersUpdated();
	}

	function toggleModifier(modifier) {
		modifier.selected = !modifier.selected;
		modifiers = modifiers;
		modifiersUpdated();
	}

	$: selectDefault(selected);
	$: selectedModifiers = modifiers.filter(m => m.selected);
	$: hasState = !!selectedModifiers.length || !include || !exclusive;
</script>

<div class="switch-container">
	<span>Scores</span>
	<Select
		bind:value={include}
		fontSize="0.7"
		options={[
			{name: 'with', value: true},
			{name: 'without', value: false},
		]}
		on:change={() => modifiersUpdated()} />
	<Select
		bind:value={exclusive}
		fontSize="0.7"
		options={[
			{name: 'all', value: true},
			{name: 'any', value: false},
		]}
		on:change={() => modifiersUpdated()} />
	<span>selected modifiers</span>
</div>
<div class="modifiers-list">
	{#each modifiers as modifier}
		<div
			class="modifier {modifier.selected ? 'selected' : ''}"
			on:click={() => toggleModifier(modifier)}
			on:keypress={() => toggleModifier(modifier)}>
			<span class="modifier-title"><i>{modifier.name}</i> </span>
			<img src={'/assets/' + modifier.icon} alt={modifier.name + ' icon'} class="modifier-icon" />
		</div>
	{/each}
</div>
{#if hasState || selectedModifiers.length != modifiers.length}
	<div class="actions">
		{#if hasState}
			<Button label="Reset" title="Unselect all modifiers" on:click={() => reset()} />
		{/if}
		{#if selectedModifiers.length != modifiers.length}
			<Button label="Select all" title="Select all modifiers" on:click={() => selectAll()} />
		{/if}
	</div>
{/if}

<style>
	:global(.wrap) {
		display: contents;
	}
	:global(.wrap .window) {
		width: auto !important;
		height: auto !important;
		background-color: rgb(26 26 26) !important;
	}
	:global(.dialog-container header) {
		margin-right: 5em;
	}

	.modifiers-list {
		display: grid;
		grid-template-columns: 6.4em 6.4em 6.4em;
		grid-gap: 0.6em;
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
		width: 1.5em;
		height: 1.5em;
		margin-left: 0.5em;
		margin-top: 1.4em;
	}

	.modifier-title {
		position: absolute;
		top: 0.8em;
		right: 0.8em;
		text-align: right;
		font-weight: 600;
		color: #ffffffde;
		max-width: 70%;
		font-size: 0.7em;
	}

	.switch-container {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		grid-gap: 0.35em;
		margin-bottom: 0.75em;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		grid-gap: 0.5em;
		margin-top: 0.75em;
	}

	@media screen and (max-width: 768px) {
		.modifiers-list {
			grid-template-columns: 46% 46%;
		}
	}
</style>
