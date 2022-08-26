<script>
	import {createEventDispatcher} from 'svelte';
	import Button from './Button.svelte';

	const dispatch = createEventDispatcher();

	export let disabled;
	export let multiple = false;
	export let value = multiple ? [] : null;
	export let items = [];
	export let optionsLabel = 'Options';
	export let optionMultiple = false;
	export let option = optionMultiple ? [] : null;
	export let optionItems = [];
	export let noSelected = 'common.nothingSelected';
	export let minSelected = 1;
	export let optionsMinSelected = 1;
	export let right = false;
	export let top = false;
	export let noLabel = false;
	export let prefix = null;

	function processItems(items, value, clickedIdx, multiple = false, minSelected = 1) {
		if (multiple) {
			const itemValueIdx = value ? value.findIndex(v => v === items[clickedIdx]) : -1;
			let newValue = [];
			if (itemValueIdx >= 0) {
				newValue = value.filter((v, idx) => idx !== itemValueIdx || value.length <= minSelected);
			} else {
				newValue = value.concat([items[clickedIdx]]);
			}

			items.forEach((item, idx) => {
				const v = newValue.find(v => v === item);
				if (v) v.idx = idx;
			});

			return newValue.sort((a, b) => a.idx - b.idx);
		} else if (value !== items[clickedIdx] || minSelected < 1) {
			return value === items[clickedIdx] && minSelected < 1 ? null : items[clickedIdx];
		}

		return null;
	}

	function onMenuClick(e) {
		const item = e.target.closest('.dropdown-item');
		if (!item) return;

		const idx = item.dataset.idx,
			optionIdx = item.dataset.optionIdx;
		if (
			(!idx && !optionIdx) ||
			(idx && (idx < 0 || idx >= items.length)) ||
			(optionIdx && (optionIdx < 0 || optionIdx >= optionItems.length))
		)
			return;

		if (idx) {
			const newValue = processItems(items, value, idx, multiple, minSelected);
			if (newValue) {
				value = newValue;

				dispatch('change', {value, option, changed: 'value'});
			}
		} else {
			const newOption = processItems(optionItems, option, optionIdx, optionMultiple, optionsMinSelected);
			if (newOption) {
				option = newOption;

				dispatch('change', {value, option, changed: 'option'});
			}
		}
	}

	$: current =
		value && (!Array.isArray(value) || value.length)
			? (prefix ?? '') + (Array.isArray(value) ? value : [value.label ? value : {label: value}]).map(v => v.label).join(', ')
			: noSelected;
</script>

<div class="multi-select" class:selected={multiple ? value?.length : value} class:disabled>
	<div class="dropdown is-hoverable">
		<div class="dropdown-trigger">
			<Button type="default" title={current} label={!noLabel ? current : null}>
				<span class="icon is-small"><i class="fas fa-angle-down" aria-hidden="true" /></span>
			</Button>
		</div>
		<div class:right class:top class="dropdown-menu" role="menu" on:click={onMenuClick}>
			<div class="dropdown-content">
				{#each items as item, idx (item)}
					{#if item.type === 'divider'}
						<hr class="dropdown-divider" />
					{:else if item.type === 'label'}
						<div class="menu-label">{item.label}</div>
					{:else}
						<div
							class="dropdown-item"
							class:is-active={value && (value === item || (Array.isArray(value) && value.includes(item)))}
							data-idx={idx}>
							<span>{item.label}</span>
							{#if value && (value === item || (Array.isArray(value) && value.includes(item)))}
								<span class="icon is-small"><i class="fas fa-check" aria-hidden="true" /></span>
							{/if}
						</div>
					{/if}
				{/each}
				{#if optionItems.length}
					<hr class="dropdown-divider" />
					<div class="menu-label">{optionsLabel}</div>
					{#each optionItems as optionItem, optionIdx (optionItem)}
						{#if optionItem.type === 'divider'}
							<hr class="dropdown-divider" />
						{:else if optionItem.type === 'label'}
							<div class="menu-label">{optionItem.label}</div>
						{:else}
							<div
								class="dropdown-item"
								class:is-active={option && (option === optionItem || (Array.isArray(option) && option.includes(optionItem)))}
								data-option-idx={optionIdx}>
								<span>{optionItem.label}</span>
								{#if option && (option === optionItem || (Array.isArray(option) && option.includes(optionItem)))}
									<span class="icon is-small"><i class="fas fa-check" aria-hidden="true" /></span>
								{/if}
							</div>
						{/if}
					{/each}
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.multi-select {
		max-width: 100%;
		font-size: inherit;
	}

	.dropdown {
		max-width: 100%;
	}

	.dropdown-trigger {
		max-width: 100%;
	}

	.dropdown-trigger .button {
		max-width: 100%;
		height: 2em;
		font-size: inherit;
		padding-left: 0.5em;
		padding-right: 1.25em;
		padding-bottom: 0;
		color: var(--textColor, #000);
		background-color: var(--foreground, #fff);
		border-color: transparent;
	}

	.dropdown-trigger .button:active,
	.dropdown-trigger .button:focus {
		outline: none;
		box-shadow: none;
	}

	.dropdown-trigger .button span {
		overflow-x: hidden;
		text-overflow: ellipsis;
	}

	.dropdown-trigger .button .icon {
		position: absolute;
		top: 0.5em;
		right: 0.25em;
	}

	.dropdown-menu {
		right: 0;
		min-width: 12.6rem;
		max-height: 25.5rem;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: var(--selected, #3273dc) var(--foreground, #fff);
	}
	.dropdown-menu::-webkit-scrollbar {
		width: 0.25rem;
	}
	body::-webkit-scrollbar-track {
		background: var(--foreground, #fff);
	}
	.dropdown-menu::-webkit-scrollbar-thumb {
		background-color: var(--selected, #3273dc);
		border-radius: 6px;
		border: 3px solid var(--selected, #3273dc);
	}

	.dropdown-menu.right {
		left: auto;
	}

	.dropdown-menu.top {
		bottom: 2.25rem;
		top: auto;
	}

	.dropdown-content {
		color: var(--textColor, #000);
		background-color: var(--foreground, #fff);
		padding-top: 0;
		box-shadow: 0 2px 3px rgba(200, 200, 00, 0.1), 0 0 0 1px rgba(200, 200, 200, 0.1);
	}

	.dropdown-content .menu-label {
		text-align: center;
	}

	.dropdown-content .menu-label:not(:first-child) {
		margin-top: 0.5em;
	}

	.dropdown-content .menu-label:not(:last-child) {
		margin-bottom: 0.5em;
	}

	.dropdown-item {
		white-space: nowrap;
		padding: 0.25em 2.5em 0.25em 1em;
		font-size: inherit;
		color: inherit;
		overflow-x: hidden;
		text-overflow: ellipsis;
		cursor: pointer;
		line-height: 1.25;
	}

	.dropdown-item:hover {
		background-color: var(--hover);
		border-color: transparent;
	}

	.dropdown-item.is-active,
	.dropdown-item.is-active:hover {
		color: var(--textColor);
		background-color: var(--selected);
	}

	.dropdown-item .icon {
		position: absolute;
		top: 0.5em;
		right: 0.5em;
		font-size: smaller;
	}
</style>
