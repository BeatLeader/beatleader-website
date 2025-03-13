<script>
	import {configStore} from '../../stores/config';
	import Select from '../Settings/Select.svelte';
	import {importFonts, setGlobalCSSValue, removeGlobalCSSValue} from '../../utils/color';
	import ColorPicker from '../Common/ColorPicker.svelte';
	import {fly, fade} from 'svelte/transition';
	import {debounce} from '../../utils/debounce';
	import {deepClone} from '../../utils/js';

	export let animationSign = 1;

	const DEFAULT_THEME = 'mirror';

	const themes = [
		{name: 'Classic - Motzel', value: 'default'},
		{name: 'Mirror - MicroBlock', value: 'mirror'},
		{name: 'Mirror(Low) - MicroBlock', value: 'mirror-low'},
		{name: 'Unbounded - MicroBlock', value: 'unbounded'},
		{name: 'ReeDark', value: 'ree-dark'},
		{name: 'FlyLight', value: 'flylight'},
	];

	let currentTheme = DEFAULT_THEME;
	let currentBGImage = '';

	let currentFontNames = 'Noto Sans, Microsoft YaHei, sans-serif';

	let currentBGColor = 'rgba(17, 17, 17, 0.3682)';
	let currentHeaderColor = 'rgba(0, 0, 0, 0.4152)';

	let currentButtonColor = 'rgba(50, 115, 219, 1.0)';
	let currentLabelColor = 'rgba(219, 219, 219, 1.0)';
	let currentPpColor = 'rgba(253, 219, 255, 1.0)';
	let currentSelectedColor = 'rgba(50, 115, 220, 1.0)';

	function onConfigUpdated(config) {
		if (config?.preferences?.theme != currentTheme) currentTheme = config?.preferences?.theme ?? DEFAULT_THEME;
		if (config?.preferences?.bgimage != currentBGImage) currentBGImage = config?.preferences?.bgimage ?? '';
		if (config?.preferences?.fontNames != currentFontNames) currentFontNames = config?.preferences?.fontNames ?? '';

		if (config?.preferences?.bgColor != currentBGColor) currentBGColor = config?.preferences?.bgColor ?? '';
		if (config?.preferences?.headerColor != currentHeaderColor) currentHeaderColor = config?.preferences?.headerColor ?? '';

		if (config?.preferences?.buttonColor != currentButtonColor) currentButtonColor = config?.preferences?.buttonColor ?? '';
		if (config?.preferences?.labelColor != currentLabelColor) currentLabelColor = config?.preferences?.labelColor ?? '';
		if (config?.preferences?.ppColor != currentPpColor) currentPpColor = config?.preferences?.ppColor ?? '';
		if (config?.preferences?.selectedColor != currentSelectedColor) currentSelectedColor = config?.preferences?.selectedColor ?? '';
	}

	async function settempsetting(key, value) {
		var preferences = deepClone(configStore.get('preferences'));
		preferences[key] = value;
		await configStore.setForKey('preferences', preferences, false);
	}

	function setCssValue(key, value) {
		if (currentTheme != 'default' && currentTheme != 'ree-dark') {
			setGlobalCSSValue(key, value);
		} else {
			removeGlobalCSSValue(key);
		}
	}

	async function bgColorCallback(bgColor) {
		setCssValue('customizable-color-1', bgColor);
		await settempsetting('bgColor', bgColor);
	}
	async function headerColorCallback(headerColor) {
		setCssValue('customizable-color-2', headerColor);
		await settempsetting('headerColor', headerColor);
	}

	async function buttonColorCallback(color) {
		setCssValue('bg-color', color);
		await settempsetting('buttonColor', color);
	}
	async function labelColorCallback(color) {
		setCssValue('color', color);
		await settempsetting('labelColor', color);
	}
	async function ppColorCallback(color) {
		setCssValue('ppColour', color);
		await settempsetting('ppColor', color);
	}
	async function selectedColorCallback(color) {
		setCssValue('selected', color);
		await settempsetting('selectedColor', color);
	}

	async function bgimagecallback(bgimage) {
		setGlobalCSSValue('background-image', 'url(' + bgimage + ')');
		await settempsetting('bgimage', bgimage);
	}

	async function fontNamesCallback(fontNames) {
		setGlobalCSSValue('font-names', fontNames);
		await settempsetting('fontNames', fontNames);

		importFonts(fontNames);
	}

	const debounceCurrentBGColor = debounce(rgba => (currentBGColor = rgba.detail), 100);
	const debounceCurrentHeaderColor = debounce(rgba => (currentHeaderColor = rgba.detail), 100);

	const debounceCurrentButtonColor = debounce(rgba => (currentButtonColor = rgba.detail), 100);
	const debounceCurrentLabelColor = debounce(rgba => (currentLabelColor = rgba.detail), 100);
	const debounceCurrentPpColor = debounce(rgba => (currentPpColor = rgba.detail), 100);
	const debounceCurrentSelectedColor = debounce(rgba => (currentSelectedColor = rgba.detail), 100);

	const debounceCurrentFontNames = debounce(event => (currentFontNames = event.srcElement.value), 500);
	const debounceCurrentBGImage = debounce(event => (currentBGImage = event.srcElement.value), 500);

	$: onConfigUpdated(configStore && $configStore ? $configStore : null);

	$: currentTheme && bgColorCallback(currentBGColor);
	$: currentTheme && headerColorCallback(currentHeaderColor);
	$: bgimagecallback(currentBGImage);
	$: currentTheme && buttonColorCallback(currentButtonColor);
	$: currentTheme && labelColorCallback(currentLabelColor);
	$: currentTheme && ppColorCallback(currentPpColor);
	$: currentTheme && selectedColorCallback(currentSelectedColor);

	$: fontNamesCallback(currentFontNames);
	$: settempsetting('theme', currentTheme);
</script>

<div class="options" in:fly|global={{y: animationSign * 200, duration: 400}} out:fade|global={{duration: 100}}>
	<section class="option">
		<label title="Choose the theme you want">Theme</label>
		<Select bind:value={currentTheme} options={themes} />
	</section>
	{#if currentTheme != 'default' && currentTheme != 'ree-dark'}
		<section class="option">
			<label title="Input url of the background image you want">Background Image</label>
			<input type="url" value={currentBGImage} on:input={debounceCurrentBGImage} />
			<span style="cursor: pointer; font-size: x-small;" on:click={() => (currentBGImage = '/assets/background.jpg')}
				><u>Reset to default</u></span>
		</section>

		<section class="option">
			<label title="Select color for the backgrounds of the elements">Main Color</label>
			<ColorPicker on:colorChange={debounceCurrentBGColor} startColor={currentBGColor} />
		</section>

		<section class="option">
			<label title="Select color for the backgrounds of the elements">Header Color</label>
			<ColorPicker on:colorChange={debounceCurrentHeaderColor} startColor={currentHeaderColor} />
		</section>

		<section class="option">
			<label title="Select color for the backgrounds of the elements">Button Color</label>
			<ColorPicker on:colorChange={debounceCurrentButtonColor} startColor={currentButtonColor} />
		</section>

		<section class="option">
			<label title="Select color for the backgrounds of the elements">Label Color</label>
			<ColorPicker on:colorChange={debounceCurrentLabelColor} startColor={currentLabelColor} />
		</section>
		<section class="option">
			<label title="Select color for the backgrounds of the elements">Selected Color</label>
			<ColorPicker on:colorChange={debounceCurrentSelectedColor} startColor={currentSelectedColor} />
		</section>

		<section class="option">
			<label title="Select color for the backgrounds of the elements">PP Color</label>
			<ColorPicker on:colorChange={debounceCurrentPpColor} startColor={currentPpColor} />
		</section>

		<section class="option">
			<label title="Input url of the background image you want">Fonts (Google Fonts or System)</label>
			<input type="text" value={currentFontNames} on:input={debounceCurrentFontNames} />
			<span style="cursor: pointer; font-size: x-small;" on:click={() => (currentFontNames = 'Noto Sans, Microsoft YaHei, sans-serif')}
				><u>Reset to default</u></span>
		</section>
	{/if}
</div>

<style>
	.options {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		grid-gap: 1em;
		align-items: start;
		justify-items: start;
	}

	.option {
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	label {
		display: block;
		font-size: 0.75em;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #afafaf !important;
		margin-bottom: 0.25em;
	}

	@media screen and (max-width: 600px) {
		.options {
			grid-template-columns: 1fr;
		}
	}
</style>
