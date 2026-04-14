<script>
	import {ModifiersList} from '../../../utils/beatleader/format';
	import {deepClone} from '../../../utils/js';
	import Button from '../../Common/Button.svelte';
	import DialogContent from '../../Common/DialogContent.svelte';
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

	function modifiersUpdated(save) {
		if (save) {
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
		} else {
			selectDefault(selected);
			oncancel();
		}
	}

	function reset() {
		resetState();
	}

	function selectAll() {
		setAllModifiersSelected(true);
	}

	$: selectDefault(selected);
	$: selectedModifiers = modifiers.filter(m => m.selected);
	$: hasState = !!selectedModifiers.length || !include || !exclusive;
</script>

<div class="dialog-container">
	<DialogContent
		type="confirm"
		title="Select modifiers to display"
		okButton="Done"
		okButtonType="primary"
		cancelButton="Cancel"
		on:confirm={() => modifiersUpdated(true)}
		on:cancel={() => modifiersUpdated(false)}>
		<div slot="content">
			<div class="switch-container">
				Scores
				<Select
					bind:value={include}
					fontSize="0.8"
					options={[
						{name: 'with', value: true},
						{name: 'without', value: false},
					]} />
				<Select
					bind:value={exclusive}
					fontSize="0.8"
					options={[
						{name: 'all', value: true},
						{name: 'any', value: false},
					]} />
				selected modifiers
			</div>
			<div class="modifiers-list">
				{#each modifiers as modifier}
					<div
						class="modifier {modifier.selected ? 'selected' : ''}"
						on:click={() => (modifier.selected = !modifier.selected)}
						on:keypress={() => (modifier.selected = !modifier.selected)}>
						<span class="modifier-title"><i>{modifier.name}</i> </span>
						<img src={'/assets/' + modifier.icon} alt={modifier.name + ' icon'} class="modifier-icon" />
					</div>
				{/each}
			</div>
			{#if hasState}
				<div class="reset-button">
					<Button label="Reset" title="Unselect all modifiers" on:click={() => reset()} />
				</div>
			{/if}
			{#if selectedModifiers.length != modifiers.length}
				<div class="reset-button">
					<Button label="Select all" title="Select all modifiers" on:click={() => selectAll()} />
				</div>
			{/if}
		</div>
	</DialogContent>
</div>

<style>
	.dialog-container {
		margin: 1em;
	}

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
		top: 1.3em;
		display: flex;
		grid-gap: 0.4em;
		align-items: center;
	}

	.reset-button {
		position: absolute;
		margin-top: 2em;
	}

	@media screen and (max-width: 768px) {
		.modifiers-list {
			grid-template-columns: 46% 46%;
		}
		.switch-container {
			position: relative;
			margin: 1em;
			top: 0;
			display: flex;
			flex-direction: column;
		}
	}
</style>
