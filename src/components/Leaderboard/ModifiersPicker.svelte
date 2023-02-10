<script>
	import {createEventDispatcher} from 'svelte';
	import {ModifiersList} from '../../utils/beatleader/format';
	import {deepClone} from '../../utils/js';
	import Button from '../Common/Button.svelte';
	import Dialog from '../Common/Dialog.svelte';
	import Switch from '../Common/Switch.svelte';

	export let selected = '';

	let any = false;
	let none = false;
	let modifiers = deepClone(ModifiersList);
	let dialogOpened = false;

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
		});
	}

	const dispatch = createEventDispatcher();
	function modifiersUpdated(save) {
		if (save) {
			var selectedModifiers = modifiers.filter(m => m.selected).map(m => m.id);
			if (any) {
				selectedModifiers.push('any');
			}

			if (none) {
				selectedModifiers.push('none');
			}

			dispatch('change', selectedModifiers.join(','));
		} else {
			selectDefault(selected);
		}

		dialogOpened = false;
	}

	let colorForM = 'white';
	function updateColor(any, none, hasState) {
		if (none) {
			colorForM = 'red';
		} else if (hasState) {
			if (any) {
				colorForM = 'blue';
			} else {
				colorForM = 'purple';
			}
		} else {
			colorForM = 'white';
		}
	}

	function reset() {
		modifiers.forEach(m => (m.selected = false));
		modifiers = modifiers;
	}

	$: selectDefault(selected);
	$: hasState = modifiers.find(m => m.selected);
	$: updateColor(any, none, hasState);
</script>

{#if dialogOpened}
	<Dialog
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
					label="None"
					title="Hide ALL scores with modifiers"
					fontSize={16}
					design="slider"
					on:click={() => (none = !none)} />
				{#if !none}
					<Switch
						value={any}
						label="Any"
						title="Show score with ANY selected modifier"
						fontSize={16}
						design="slider"
						on:click={() => (any = !any)} />
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
	</Dialog>
{/if}

<div class="filter" class:open={dialogOpened} title="Filter by modifiers">
	<i
		style="color: {colorForM}"
		class={`fas filter-btn fa-m`}
		class:fa-times={dialogOpened}
		on:click={() => (dialogOpened = !dialogOpened)}
		on:keypress={() => (dialogOpened = !dialogOpened)} />
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

	.filter.open .filter-btn {
		width: auto;
		background-color: var(--error);
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
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
