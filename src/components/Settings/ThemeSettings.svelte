<script>
	import {configStore} from '../../stores/config';
	import Select from '../Settings/Select.svelte';
	import {importFonts, setGlobalCSSValue} from '../../utils/color';
	import ColorPicker from '../Common/ColorPicker.svelte';
	import {fly, fade} from 'svelte/transition';

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
	let currentBGColor = 'rgba(131, 131, 131, 0.082)';
	let currentHeaderColor = 'rgba(92, 92, 92, 0.281)';
	let currentFontNames = 'Noto Sans, Noto Sans SC, Microsoft YaHei, sans-serif';

	function onConfigUpdated(config) {
		if (config?.preferences?.theme != currentTheme) currentTheme = config?.preferences?.theme ?? DEFAULT_THEME;
		if (config?.preferences?.bgimage != currentBGImage) currentBGImage = config?.preferences?.bgimage ?? '';
		if (config?.preferences?.bgColor != currentBGColor) currentBGColor = config?.preferences?.bgColor ?? '';
		if (config?.preferences?.headerColor != currentHeaderColor) currentHeaderColor = config?.preferences?.headerColor ?? '';
		if (config?.preferences?.fontNames != currentFontNames) currentFontNames = config?.preferences?.fontNames ?? '';
	}

	async function settempsetting(key, value) {
		var preferences = configStore.get('preferences');
		preferences[key] = value;
		await configStore.setForKey('preferences', preferences, false);
	}

	async function bgColorCallback(bgColor) {
		setGlobalCSSValue('customizable-color-1', bgColor);
		await settempsetting('bgColor', bgColor);
	}
	async function headerColorCallback(headerColor) {
		setGlobalCSSValue('customizable-color-2', headerColor);
		await settempsetting('headerColor', headerColor);
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

	$: onConfigUpdated(configStore && $configStore ? $configStore : null);

	$: bgColorCallback(currentBGColor);
	$: headerColorCallback(currentHeaderColor);
	$: bgimagecallback(currentBGImage);
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
			<input type="url" bind:value={currentBGImage} />
			<span style="cursor: pointer; font-size: x-small;" on:click={() => (currentBGImage = '/assets/background.jpg')}
				><u>Reset to default</u></span>
		</section>

		<section class="option">
			<label title="Select color for the backgrounds of the elements">Main Color</label>
			<ColorPicker on:colorChange={rgba => (currentBGColor = rgba.detail)} startColor={currentBGColor} />
		</section>

		<section class="option">
			<label title="Select color for the backgrounds of the elements">Header Color</label>
			<ColorPicker on:colorChange={rgba => (currentHeaderColor = rgba.detail)} startColor={currentHeaderColor} />
		</section>

		<section class="option">
			<label title="Input url of the background image you want">Fonts (Google Fonts or System)</label>
			<input type="text" bind:value={currentFontNames} />
			<span
				style="cursor: pointer; font-size: x-small;"
				on:click={() => (currentFontNames = 'Noto Sans, Noto Sans SC, Microsoft YaHei, sans-serif')}><u>Reset to default</u></span>
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
