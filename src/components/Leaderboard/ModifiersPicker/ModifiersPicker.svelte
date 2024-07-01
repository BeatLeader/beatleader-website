<script>
	import {ModifiersList} from '../../../utils/beatleader/format';
	import {deepClone} from '../../../utils/js';
	import Button from '../../Common/Button.svelte';
	import DialogContent from '../../Common/DialogContent.svelte';
	import Switch from '../../Common/Switch.svelte';

	export let selected = '';
	export let onchange;
	export let oncancel;

	let any = false;
	let none = false;
	let not = false;
	let modifiers = deepClone(ModifiersList);

	function selectDefault(selected) {
		if (!selected) return;

		selected.split(',').forEach(element => {
			var modifier = modifiers.find(m => m.id == element);
			if (modifier) {
				modifier.selected = true;
			}

			if (element == 'any') {
				any = true;
			}

			if (element == 'none') {
				none = true;
			}
			if (element == 'not') {
				not = true;
			}
		});
	}

	function modifiersUpdated(save) {
		if (save) {
			var selectedModifiers = modifiers.filter(m => m.selected).map(m => m.id);
			if (any) {
				selectedModifiers.push('any');
			}

			if (none) {
				selectedModifiers.push('none');
			}
			if (not) {
				selectedModifiers.push('not');
			}

			onchange(selectedModifiers.join(','));
		} else {
			selectDefault(selected);
			oncancel();
		}
	}

	function reset() {
		modifiers.forEach(m => (m.selected = false));
		modifiers = modifiers;
	}

	$: selectDefault(selected);
	$: hasState = modifiers.find(m => m.selected);
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
				<Switch
					value={none}
					label="Hide all"
					title="Hide ALL scores with modifiers"
					fontSize={16}
					design="slider"
					on:click={() => (none = !none)} />
				{#if !none}
					{#if !not}
						<Switch
							value={any}
							label="Any selected"
							title="Show score with ANY selected modifier"
							fontSize={16}
							design="slider"
							on:click={() => (any = !any)} />
					{/if}
					<Switch
						value={not}
						label="Exclude selected"
						title="Show score without ANY selected modifier"
						fontSize={16}
						design="slider"
						on:click={() => (not = !not)} />
				{/if}
			</div>
			{#if !none}
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
		grid-gap: 1em;
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
