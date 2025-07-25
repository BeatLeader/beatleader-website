<script>
	import {fly} from 'svelte/transition';
	import {clickOutside} from '../../svelte-utils/actions/click-outside';
	import {createEventDispatcher, onDestroy} from 'svelte';
	import {pxToEm} from '../../utils/conversions.js';
	import {clamp} from '../../utils/math.js';
	import PageOverlay from '../Common/PageOverlay.svelte';

	export let options = [];
	export let value = options?.length > 0 ? options[0] : null;
	export let nameSelector = obj => obj?.name;
	export let valueSelector = obj => obj?.value;
	export let nullPlaceholder = 'Select an option';

	export let fontPadding = 0.4;
	export let fontSize = 1;
	export let menuFontSize = fontSize;

	const dispatch = createEventDispatcher();
	let isOpened = false;
	let header = null;
	let menu = null;
	let focusedItem = null;
	let focusableItems = null;
	let focusedItemIndex = 0;

	window.addEventListener('resize', onResize);

	function toggleDropdown() {
		if (options?.length == 0 ?? true) return;
		isOpened = !isOpened;
		focusableItems = null;
		focusedItemIndex = -1;
	}

	function selectOption(option) {
		value = valueSelector(option);
		toggleDropdown();
		dispatch('change', option);
	}

	function focusItem(next) {
		focusableItems ??= Array.from(menu.childNodes).filter(x => x.tabIndex >= 0);
		focusedItemIndex = clamp(next ? focusedItemIndex + 1 : focusedItemIndex - 1, 0, focusableItems.length - 1);
		focusedItem = focusableItems[focusedItemIndex];
		focusedItem.focus();
	}

	function onResize() {
		if (!isOpened) return;
		menu.style.minWidth = header.clientWidth + 'px';
	}

	function onClickHeader() {
		toggleDropdown();
	}

	function onKeyDownHeader(e) {
		if (e.key != 'Enter') return;
		e.preventDefault();
		toggleDropdown();
	}

	function onKeyDownMenu(e) {
		e.preventDefault();
		switch (e.key) {
			case 'Escape':
				toggleDropdown();
				break;
			case 'Enter':
			case 'Space':
				selectOption(options.find(x => nameSelector(x) == focusedItem.outerText));
				break;
			case 'ArrowUp':
				focusItem(false);
				break;
			case 'ArrowDown':
				focusItem(true);
				break;
		}
	}

	onDestroy(() => {
		var overlay = document.getElementById('overlay-wrapper');
		if (overlay) overlay.remove();
		window.removeEventListener('resize', onResize);
	});
</script>

<div class="dropdown" use:clickOutside={{callback: () => (isOpened = false)}}>
	<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
	<div
		bind:this={header}
		class="dropdown-header"
		style="font-size: {fontSize}em; padding: {fontPadding}em"
		tabindex="0"
		on:click={onClickHeader}
		on:keydown={onKeyDownHeader}>
		<div class="dropdown-header-text" style="padding-left: {fontPadding}em">
			{#if options?.length > 0 && value != null && options.find(x => valueSelector(x) == value)?.icon}
				<i class="fa {options.find(x => valueSelector(x) == value).icon}" style="margin-right: {fontPadding}em" />
			{/if}
			{options?.length > 0 ? (value != null ? nameSelector(options.find(x => valueSelector(x) == value)) : nullPlaceholder) : 'No options'}
		</div>
		<div style="padding: 0 {fontPadding}em 0 {fontPadding * 2}em">
			<i class="fa fa-chevron-down dropdown-arrow {isOpened ? 'opened' : ''}" />
		</div>
	</div>
	{#if header && isOpened && options?.length > 0}
		<PageOverlay target={header}>
			<div
				bind:this={menu}
				in:fly|global={{y: -5, duration: 200}}
				out:fly|global={{y: -5, duration: 200}}
				on:introend={menu.focus()}
				on:keydown={onKeyDownMenu}
				tabIndex="0"
				class="dropdown-menu"
				style="margin-top: {pxToEm(header.clientHeight) + 0.3}em; min-width: {header.clientWidth}px">
				{#each options as item}
					{#if valueSelector(item) != value}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
						<div tabindex="0" class="dropdown-item" style="font-size: {menuFontSize}em" on:click={selectOption(item)}>
							{#if item.icon}
								<i class="fa {item.icon} dropdown-item-icon" style="margin-right: {fontPadding}em" />
							{/if}
							{nameSelector(item).trim()}
						</div>
					{/if}
				{/each}
			</div>
		</PageOverlay>
	{/if}
</div>

<style>
	.dropdown-arrow {
		transition: transform 200ms;
	}

	.dropdown-arrow.opened {
		transition: transform 200ms;
		transform: rotateZ(180deg);
	}

	.dropdown-menu {
		display: block;
		min-width: fit-content;
		margin-top: 0.4em;
		width: min-content;
		top: auto;
	}

	.dropdown-item {
		padding: 0.6em;
		border-bottom: 1px solid gray;
		cursor: pointer;
		color: white;
		white-space: nowrap;
		min-width: fit-content;
	}

	.dropdown-item-icon {
		width: 1.2em;
		height: 1.2em;
		text-align: center;
	}

	.dropdown-header-text i {
		width: 1em;
		height: 1em;
	}
</style>
