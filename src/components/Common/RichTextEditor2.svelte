<script>
	export let initialValue = null;
	import 'grapesjs/dist/css/grapes.min.css';
	import grapesjs from 'grapesjs';

	import {createEventDispatcher, onMount} from 'svelte';

	const dispatch = createEventDispatcher();

	const plugins = [
		'gjs-blocks-basic',
		'grapesjs-tabs',
		'grapesjs-touch',
		'grapesjs-parser-postcss',
		'grapesjs-tooltip',
		'grapesjs-tui-image-editor',
		'grapesjs-typed',
		'grapesjs-style-bg',
		'grapesjs-preset-webpage',
		editor => {
			editor.I18n.addMessages({
				en: {
					styleManager: {
						properties: {
							'background-repeat': 'Repeat',
							'background-position': 'Position',
							'background-attachment': 'Attachment',
							'background-size': 'Size',
						},
					},
				},
			});

			editor.onReady(() => {
				const pn = editor.Panels;

				// Load and show settings and style manager
				const openTmBtn = pn.getButton('views', 'open-tm');
				const openSm = pn.getButton('views', 'open-sm');
				openTmBtn?.set('active', true);
				openSm?.set('active', true);

				// Remove trait view
				pn.removeButton('views', 'open-tm');

				// Add Settings Sector
				const traitsSectorEl = document.createElement('div');
				traitsSectorEl.className = 'gjs-sm-sector no-select';
				traitsSectorEl.innerHTML = `
                <div class="gjs-sm-sector-title"><span class="icon-settings fa fa-cog"></span> <span class="gjs-sm-sector-label">Settings</span></div>
                <div class="gjs-sm-properties" style="display: none;"></div>
            `;
				const traitsPropsEl = traitsSectorEl.querySelector('.gjs-sm-properties');
				const traitsEl = document.querySelector('.gjs-traits-cs');
				const sectorsEl = document.querySelector('.gjs-sm-sectors');
				const traitsTitleEl = traitsSectorEl.querySelector('.gjs-sm-sector-title');
				traitsPropsEl.appendChild(traitsEl);
				sectorsEl.prepend(traitsSectorEl);
				traitsTitleEl.onclick = () => {
					const traitStyle = traitsPropsEl.style;
					const hidden = traitStyle.display == 'none';
					traitStyle.display = hidden ? 'block' : 'none';
				};

				// Open block manager
				const openBlocksBtn = editor.Panels.getButton('views', 'open-blocks');
				openBlocksBtn?.set('active', true);

				const sm = editor.StyleManager;
				const fontFamilyProp = sm.getProperty('typography', 'font-family');
				fontFamilyProp.set('options', [{value: '"Noto Sans", sans-serif', name: 'Noto Sans'}, ...fontFamilyProp.get('options')]);
			});
		},
	];

	const pluginsOpts = {
		'gjs-blocks-basic': {
			flexGrid: true,
		},
		'grapesjs-tui-image-editor': {
			script: [
				'https://uicdn.toast.com/tui.code-snippet/v1.5.2/tui-code-snippet.min.js',
				'https://uicdn.toast.com/tui-color-picker/v2.2.7/tui-color-picker.min.js',
				'https://uicdn.toast.com/tui-image-editor/v3.15.2/tui-image-editor.min.js',
			],
			style: [
				'https://uicdn.toast.com/tui-color-picker/v2.2.7/tui-color-picker.min.css',
				'https://uicdn.toast.com/tui-image-editor/v3.15.2/tui-image-editor.min.css',
			],
		},
		'grapesjs-tabs': {
			tabsBlock: {
				category: 'Extra',
			},
		},
		'grapesjs-typed': {
			block: {
				category: 'Extra',
				content: {
					type: 'typed',
					'type-speed': 40,
					strings: ['Text row one', 'Text row two', 'Text row three'],
				},
			},
		},
	};

	function addButtons(editor) {
		const panelManager = editor.Panels;
		const buttons = panelManager.getPanel('devices-c').get('buttons');

		buttons.reset();

		buttons.add([
			{
				id: 'save-button',
				className: 'fa fa-save',
				command: 'save-command',
				attributes: {title: 'Save'},
			},
			{
				id: 'cancel-button',
				className: 'fa fa-times',
				command: 'cancel-command',
				attributes: {title: 'Cancel'},
			},
		]);

		editor.Commands.add('save-command', {
			run: function (editor, sender) {
				const html = editor.getHtml();
				const css = editor.getCss();
				const completeContent = `<html>
                                    <head>
                                        <style>${css}</style>
                                    </head>
                                    <body>${html}</body>
                                </html>`;
				dispatch('post', completeContent);
			},
		});

		editor.Commands.add('cancel-command', {
			run: function (editor, sender) {
				dispatch('cancel', '');
			},
		});
	}

	localStorage.removeItem('gjs-components');
	localStorage.removeItem('gjs-styles');
	localStorage.removeItem('gjs-html');
	localStorage.removeItem('gjs-css');
	localStorage.removeItem('gjsProject');

	let textArea;

	$: editor =
		textArea &&
		grapesjs.init({
			height: '100vh',
			container: '#gjs',
			fromElement: false,
			components: initialValue,
			showOffsets: true,
			assetManager: {
				embedAsBase64: true,
			},
			selectorManager: {componentFirst: true},
			styleManager: {
				sectors: [
					{
						name: 'General',
						properties: [
							{
								extend: 'float',
								type: 'radio',
								default: 'none',
								options: [
									{value: 'none', className: 'fa fa-times'},
									{value: 'left', className: 'fa fa-align-left'},
									{value: 'right', className: 'fa fa-align-right'},
								],
							},
							'display',
							{extend: 'position', type: 'select'},
							'top',
							'right',
							'left',
							'bottom',
						],
					},
					{
						name: 'Dimension',
						open: false,
						properties: [
							'width',
							{
								id: 'flex-width',
								type: 'integer',
								name: 'Width',
								units: ['px', '%'],
								property: 'flex-basis',
								toRequire: 1,
							},
							'height',
							'max-width',
							'min-height',
							'margin',
							'padding',
						],
					},
					{
						name: 'Typography',
						open: false,
						properties: [
							'font-family',
							'font-size',
							'font-weight',
							'letter-spacing',
							'color',
							'line-height',
							{
								extend: 'text-align',
								options: [
									{id: 'left', label: 'Left', className: 'fa fa-align-left'},
									{id: 'center', label: 'Center', className: 'fa fa-align-center'},
									{id: 'right', label: 'Right', className: 'fa fa-align-right'},
									{id: 'justify', label: 'Justify', className: 'fa fa-align-justify'},
								],
							},
							{
								property: 'text-decoration',
								type: 'radio',
								default: 'none',
								options: [
									{id: 'none', label: 'None', className: 'fa fa-times'},
									{id: 'underline', label: 'underline', className: 'fa fa-underline'},
									{id: 'line-through', label: 'Line-through', className: 'fa fa-strikethrough'},
								],
							},
							'text-shadow',
						],
					},
					{
						name: 'Decorations',
						open: false,
						properties: [
							'opacity',
							'border-radius',
							'border',
							'box-shadow',
							'background', // { id: 'background-bg', property: 'background', type: 'bg' }
						],
					},
					{
						name: 'Extra',
						open: false,
						buildProps: ['transition', 'perspective', 'transform'],
					},
					{
						name: 'Flex',
						open: false,
						properties: [
							{
								name: 'Flex Container',
								property: 'display',
								type: 'select',
								defaults: 'block',
								list: [
									{value: 'block', name: 'Disable'},
									{value: 'flex', name: 'Enable'},
								],
							},
							{
								name: 'Flex Parent',
								property: 'label-parent-flex',
								type: 'integer',
							},
							{
								name: 'Direction',
								property: 'flex-direction',
								type: 'radio',
								defaults: 'row',
								list: [
									{
										value: 'row',
										name: 'Row',
										className: 'icons-flex icon-dir-row',
										title: 'Row',
									},
									{
										value: 'row-reverse',
										name: 'Row reverse',
										className: 'icons-flex icon-dir-row-rev',
										title: 'Row reverse',
									},
									{
										value: 'column',
										name: 'Column',
										title: 'Column',
										className: 'icons-flex icon-dir-col',
									},
									{
										value: 'column-reverse',
										name: 'Column reverse',
										title: 'Column reverse',
										className: 'icons-flex icon-dir-col-rev',
									},
								],
							},
							{
								name: 'Justify',
								property: 'justify-content',
								type: 'radio',
								defaults: 'flex-start',
								list: [
									{
										value: 'flex-start',
										className: 'icons-flex icon-just-start',
										title: 'Start',
									},
									{
										value: 'flex-end',
										title: 'End',
										className: 'icons-flex icon-just-end',
									},
									{
										value: 'space-between',
										title: 'Space between',
										className: 'icons-flex icon-just-sp-bet',
									},
									{
										value: 'space-around',
										title: 'Space around',
										className: 'icons-flex icon-just-sp-ar',
									},
									{
										value: 'center',
										title: 'Center',
										className: 'icons-flex icon-just-sp-cent',
									},
								],
							},
							{
								name: 'Align',
								property: 'align-items',
								type: 'radio',
								defaults: 'center',
								list: [
									{
										value: 'flex-start',
										title: 'Start',
										className: 'icons-flex icon-al-start',
									},
									{
										value: 'flex-end',
										title: 'End',
										className: 'icons-flex icon-al-end',
									},
									{
										value: 'stretch',
										title: 'Stretch',
										className: 'icons-flex icon-al-str',
									},
									{
										value: 'center',
										title: 'Center',
										className: 'icons-flex icon-al-center',
									},
								],
							},
							{
								name: 'Flex Children',
								property: 'label-parent-flex',
								type: 'integer',
							},
							{
								name: 'Order',
								property: 'order',
								type: 'integer',
								defaults: 0,
								min: 0,
							},
							{
								name: 'Flex',
								property: 'flex',
								type: 'composite',
								properties: [
									{
										name: 'Grow',
										property: 'flex-grow',
										type: 'integer',
										defaults: 0,
										min: 0,
									},
									{
										name: 'Shrink',
										property: 'flex-shrink',
										type: 'integer',
										defaults: 0,
										min: 0,
									},
									{
										name: 'Basis',
										property: 'flex-basis',
										type: 'integer',
										units: ['px', '%', ''],
										unit: '',
										defaults: 'auto',
									},
								],
							},
							{
								name: 'Align',
								property: 'align-self',
								type: 'radio',
								defaults: 'auto',
								list: [
									{
										value: 'auto',
										name: 'Auto',
									},
									{
										value: 'flex-start',
										title: 'Start',
										className: 'icons-flex icon-al-start',
									},
									{
										value: 'flex-end',
										title: 'End',
										className: 'icons-flex icon-al-end',
									},
									{
										value: 'stretch',
										title: 'Stretch',
										className: 'icons-flex icon-al-str',
									},
									{
										value: 'center',
										title: 'Center',
										className: 'icons-flex icon-al-center',
									},
								],
							},
						],
					},
				],
			},
			plugins,
			pluginsOpts,
		});
	$: editor && addButtons(editor);
</script>

<div id="gjs" bind:this={textArea} />

<style>
	:global(.gjs-pn-btn .fa .fa-save) {
		color: green;
	}

	:global(.gjs-pn-btn .fa .fa-times) {
		color: red;
	}

	:global(.gjs-one-bg) {
		background-color: transparent !important;
	}
</style>
