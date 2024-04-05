<script>
	import {createEventDispatcher} from 'svelte';
	import Spinner from './Spinner.svelte';

	const dispatch = createEventDispatcher();

	export let label = '';
	export let icon = null;
	export let iconFa = null;
	export let disabled = false;
	export let type = 'default';
	export let cls = '';
	export let title = null;
	export let noMargin = false;
	export let color = null;
	export let bgColor = null;
	export let notSelected = false;
	export let options = null;
	export let selectedOption = null;
	export let loading = false;
	export let url = null;
	export let onlyurl = false;
	export let square = false,
		squareSize = '0';
	export let preventDefault = false;
	export let animated = false;

	if (!selectedOption && options && Array.isArray(options) && options.length) selectedOption = options[0];

	const types = {
		default: {
			color: '#444',
			activeColor: '#222',
			bgColor: '#dbdbdb',
			activeBgColor: '#aaa',
			border: 'transparent',
			activeBorder: 'transparent',
		},
		primary: {
			color: '#dbdbdb',
			activeColor: '#fff',
			bgColor: '#3273db',
			activeBgColor: '#2366d1',
			border: 'transparent',
			activeBorder: 'transparent',
		},
		text: {
			color: 'var(--textColor)',
			activeColor: 'var(--textColor)',
			bgColor: 'transparent',
			activeBgColor: 'transparent',
			border: 'transparent',
			activeBorder: 'transparent',
		},
		twitch: {
			color: '#dbdbdb',
			activeColor: '#fff',
			bgColor: '#9146ff',
			activeBgColor: '#8333ff',
			border: 'transparent',
			activeBorder: 'transparent',
		},
		blurple: {
			color: '#dbdbdb',
			activeColor: '#fff',
			bgColor: '#7289da',
			activeBgColor: '#8333ff',
			border: 'transparent',
			activeBorder: 'transparent',
		},
		twitter: {
			color: '#dbdbdb',
			activeColor: '#fff',
			bgColor: '#1DA1F2',
			activeBgColor: '#1DA1F2',
			border: 'transparent',
			activeBorder: 'transparent',
		},
		patreon: {
			color: 'black',
			activeColor: '#fff',
			bgColor: '#ff424d',
			activeBgColor: '#1DA1F2',
			border: 'transparent',
			activeBorder: 'transparent',
		},
		gray: {
			color: '#dbdbdb',
			activeColor: '#fff',
			bgColor: '#8d8473',
			activeBgColor: '#1DA1F2',
			border: 'transparent',
			activeBorder: 'transparent',
		},
		danger: {
			color: '#dbdbdb',
			activeColor: '#fff',
			bgColor: '#f90716',
			activeBgColor: '#bf0000',
			border: 'transparent',
			activeBorder: 'transparent',
		},
		green: {
			color: '#dbdbdb',
			activeColor: '#fff',
			bgColor: 'green',
			activeBgColor: '#bf0000',
			border: 'transparent',
			activeBorder: 'transparent',
		},
		purple: {
			color: 'white',
			activeColor: '#fff',
			bgColor: '#dd80f2',
			activeBgColor: '#bf0000',
			border: 'transparent',
			activeBorder: 'transparent',
		},
		lessdanger: {
			color: '#dbdbdb',
			activeColor: '#fff',
			bgColor: 'orange',
			activeBgColor: '#bfbf00',
			border: 'transparent',
			activeBorder: 'transparent',
		},
	};

	let pressed = false;

	function HandleMouseDown(e) {
		let boundingRect = e.target.getBoundingClientRect();

		// calculate the width and height of the 90% box inside the element
		let innerWidth = boundingRect.width * 0.8;
		let innerHeight = boundingRect.height * 0.8;

		// calculate the position of the 90% box
		let innerX = boundingRect.x + boundingRect.width * 0.1;
		let innerY = boundingRect.y + boundingRect.height * 0.1;

		// check if the mouse down event is within the 90% box
		if (e.clientX >= innerX && e.clientX <= innerX + innerWidth && e.clientY >= innerY && e.clientY <= innerY + innerHeight) {
			pressed = true;
		} else {
			pressed = false;
		}
	}

	function HandleMouseUp() {
		pressed = false;
	}

	$: hoveredScale = animated ? (pressed ? '90%' : '110%') : '100%';

	$: selectedType = types[type] ? types[type] : types.default;
	$: margin = label && label.length ? '.45em' : '1px';
	$: btnPadding = type === 'text' ? 0 : label && label.length ? 'calc(.45em - 1px) 1em' : 'calc(.45em - 1px) .25em';
	$: btnMargin = noMargin ? 0 : '0 0 .45em 0';
</script>

{#if url && url.length}
	<a
		href={url}
		style="--color:{color ? color : selectedType.color}; --bg-color: {bgColor
			? bgColor
			: selectedType.bgColor}; --border:{selectedType.border};--active-color: {selectedType.activeColor}; --active-bg-color: {selectedType.activeBgColor}; --active-border: {selectedType.activeBorder}; --margin: {margin}; --btn-padding: {btnPadding}; --btn-margin: {btnMargin}; {square
			? `width:${squareSize};height:${squareSize};`
			: ''};
			--hovered-scale:{hoveredScale};"
		on:mousedown={HandleMouseDown}
		on:mouseup={HandleMouseUp}
		on:mouseleave={HandleMouseUp}
		on:click={e => {
			if (!onlyurl) {
				e.preventDefault();
				e.stopPropagation();
			}
			dispatch('click', selectedOption);
		}}
		{disabled}
		{title}
		class={'button clickable ' + (type ? type : 'default') + (animated ? ' animated' : '') + ' ' + cls}
		class:not-selected={notSelected}
		class:disabled>
		{#if icon && !loading}<span class="icon">{@html icon}</span>{/if}
		{#if iconFa && !loading}<i class={iconFa} />{/if}
		{#if loading}<i><Spinner /></i>{/if}
		<span>{label}</span>
		<slot />
	</a>
{:else}
	<button
		style="--color:{color ? color : selectedType.color}; --bg-color: {bgColor
			? bgColor
			: selectedType.bgColor}; --border:{selectedType.border};--active-color: {selectedType.activeColor}; --active-bg-color: {selectedType.activeBgColor}; --active-border: {selectedType.activeBorder}; --margin: {margin}; --btn-padding: {btnPadding}; --btn-margin: {btnMargin};{square
			? `width:${squareSize};height:${squareSize};`
			: ''};
			--hovered-scale:{hoveredScale};"
		on:mousedown={HandleMouseDown}
		on:mouseup={HandleMouseUp}
		on:mouseleave={HandleMouseUp}
		on:click|stopPropagation={e => {
			dispatch('click', selectedOption);
			if (preventDefault) e.preventDefault();
		}}
		{disabled}
		{title}
		class={'button clickable ' + (type ? type : 'default') + (animated ? ' animated' : '') + ' ' + cls}
		class:not-selected={notSelected}>
		{#if icon}<span class="icon">{@html icon}</span>{/if}
		{#if iconFa && !loading}<i class={iconFa} />{/if}
		{#if loading}<i><Spinner /></i>{/if}
		<span>{label}</span>
		<slot />
	</button>
{/if}

<style>
	a.button {
		display: inline-flex;
		align-items: center;
	}

	.button {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		vertical-align: top;
		padding: var(--btn-padding, calc(0.45em - 1px) 1em);
		margin: var(--btn-margin, 0 0 0.45em 0);
		text-align: center;
		white-space: nowrap;
		border: 1px solid var(--border, #dbdbdb);
		border-radius: 0.2em;
		font-size: inherit;
		cursor: pointer;
		color: var(--color, #363636) !important;
		background-color: var(--bg-color, #3273dc) !important;
		outline: none !important;
		box-shadow: none;
	}

	.button:hover {
		color: var(--active-color, #fff);
		border-color: var(--active-border, #b5b5b5);
	}

	.button.animated:hover {
		transform: scale(var(--hovered-scale));
	}

	.button:active {
		background-color: var(--active-bg-color, #fff);
	}

	a.button[disabled] {
		opacity: 1;
	}

	button[disabled],
	a.button.disabled {
		cursor: not-allowed;
		opacity: 0.35;
		color: var(--active-color, white);
		background-color: var(--bg-color, #3273dc);
	}

	.button .icon:first-child:not(:last-child),
	.button i:first-child:not(:last-child) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.3em;
		height: 1.3em;
		margin-left: calc(- var(--margin, 0.45em) - 1px);
		margin-right: var(--margin, 0.45em);
	}

	.button :global(.dropdown-trigger button) {
		color: inherit !important;
		background-color: inherit !important;
	}

	.not-selected {
		opacity: 0.35 !important;
	}

	.not-selected:hover {
		opacity: 1;
	}

	:global(.button.is-loading::after) {
		border-color: transparent transparent rgba(0, 0, 0, 0.7) rgba(0, 0, 0, 0.7) !important;
	}

	:global(.button.twitch.is-loading::after) {
		border-color: transparent transparent rgba(219, 219, 219, 1) rgba(219, 219, 219, 1) !important;
	}

	:global(button .icon svg),
	:global(button i) {
		display: inline-block;
		width: 1.3em;
		height: 1.3em;
		vertical-align: -0.125em;
		overflow: visible;
		max-width: 100%;
		max-height: 100%;
		fill: currentColor;
	}
</style>
