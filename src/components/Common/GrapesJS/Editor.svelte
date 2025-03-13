<script>
	import 'grapesjs/dist/css/grapes.min.css';
	import 'grapick/dist/grapick.min.css';
	import {createEventDispatcher, onMount} from 'svelte';
	import {mapBlock} from './Blocks/MapBlock';
	import {replayBlock} from './Blocks/ReplayBlock';

	const grapesImports = {
		grapesjs: () => import('grapesjs'),
		gjsBlocksBasic: () => import('grapesjs-blocks-basic'),
		grapesjsBlocksFlexbox: () => import('grapesjs-blocks-flexbox'),
		grapesjsTabs: () => import('grapesjs-tabs'),
		grapesjsCustomCode: () => import('grapesjs-custom-code'),
		grapesjsPluginExport: () => import('grapesjs-plugin-export'),
		grapesjsPluginForms: () => import('grapesjs-plugin-forms'),
		grapesjsTouch: () => import('grapesjs-touch'),
		grapesjsParserPostcss: () => import('grapesjs-parser-postcss'),
		grapesjsTooltip: () => import('grapesjs-tooltip'),
		grapesjsTuiImageEditor: () => import('grapesjs-tui-image-editor'),
		grapesjsStyleGradient: () => import('grapesjs-style-gradient'),
		grapesjsTyped: () => import('grapesjs-typed'),
		grapesjsStyleBg: () => import('grapesjs-style-bg'),
		grapesjsPresetWebpage: () => import('grapesjs-preset-webpage'),
		grapesjsFloat: () => import('grapesjs-float'),
		grapesjsPluginCkeditor: () => import('grapesjs-plugin-ckeditor'),
		grapesjsFonts: () => import('@silexlabs/grapesjs-fonts'),
		grapesjsClasses: () => import('grapesjs-ui-suggest-classes'),
	};

	export let initialValue = null;
	export let vertical = false;

	const dispatch = createEventDispatcher();

	let textArea;
	let editor;
	let loading = true;

	async function initializeEditor() {
		loading = true;
		try {
			const [
				{default: grapesjs},
				{default: gjsBlocksBasic},
				{default: grapesjsBlocksFlexbox},
				{default: grapesjsTabs},
				{default: grapesjsCustomCode},
				{default: grapesjsPluginExport},
				{default: grapesjsPluginForms},
				{default: grapesjsTouch},
				{default: grapesjsParserPostcss},
				{default: grapesjsTooltip},
				{default: grapesjsTuiImageEditor},
				{default: grapesjsStyleGradient},
				{default: grapesjsTyped},
				{default: grapesjsStyleBg},
				{default: grapesjsPresetWebpage},
				{default: grapesjsPluginCkeditor},
				{default: grapesjsFloat},
				{default: grapesjsFonts},
				{default: grapesjsClasses},
			] = await Promise.all([
				grapesImports.grapesjs(),
				grapesImports.gjsBlocksBasic(),
				grapesImports.grapesjsBlocksFlexbox(),
				grapesImports.grapesjsTabs(),
				grapesImports.grapesjsCustomCode(),
				grapesImports.grapesjsPluginExport(),
				grapesImports.grapesjsPluginForms(),
				grapesImports.grapesjsTouch(),
				grapesImports.grapesjsParserPostcss(),
				grapesImports.grapesjsTooltip(),
				grapesImports.grapesjsTuiImageEditor(),
				grapesImports.grapesjsStyleGradient(),
				grapesImports.grapesjsTyped(),
				grapesImports.grapesjsStyleBg(),
				grapesImports.grapesjsPresetWebpage(),
				grapesImports.grapesjsPluginCkeditor(),
				grapesImports.grapesjsFloat(),
				grapesImports.grapesjsFonts(),
				grapesImports.grapesjsClasses(),
			]);

			const plugins = [
				gjsBlocksBasic,
				grapesjsBlocksFlexbox,
				grapesjsTabs,
				grapesjsCustomCode,
				grapesjsPluginExport,
				grapesjsPluginForms,
				grapesjsTouch,
				grapesjsParserPostcss,
				grapesjsTooltip,
				grapesjsTuiImageEditor,
				grapesjsStyleGradient,
				grapesjsTyped,
				grapesjsStyleBg,
				grapesjsPresetWebpage,
				grapesjsPluginCkeditor,
				grapesjsFloat,
				grapesjsFonts,
				grapesjsClasses,
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

					editor.Commands.add('switch-drag-mode', {
						run: function (editor) {
							editor.setDragMode('absolute');
						},
						stop: function (editor) {
							editor.setDragMode('translate');
						},
					});

					const panel = editor.Panels.getPanel('options');

					const optionsButtons = panel.get('buttons');

					const customButton = editor.Panels.addButton('options', {
						id: 'switch-drag-mode-button',
						className: 'fa fa-anchor',
						command: 'switch-drag-mode',
						active: false,
						attributes: {title: 'Switch drag-drop style (absolute/flexible)'},
					});

					optionsButtons.remove(customButton);
					optionsButtons.unshift(customButton);

					mapBlock(editor);
					replayBlock(editor);

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

						parseAndAddFontsFromHTML(initialValue, editor);

						const css = 'body { background-color: transparent !important; color: white; }'; // Set to transparent or any other color
						const style = document.createElement('style');
						style.type = 'text/css';
						style.appendChild(document.createTextNode(css));

						// Access the iframe document and append the style
						const frameHead = editor.Canvas.getFrameEl().contentDocument.head;
						frameHead.appendChild(style);

						const typographySection = editor.Panels.getPanel('views-container').view.el.querySelectorAll('.gjs-sm-properties')[5];

						// Create the button element
						const addButton = document.createElement('button');
						addButton.innerHTML = '<i class="fa fa-font"></i> Add Font';
						addButton.className = 'gjs-btn-prim gjs-btn-add-font'; // Use GrapesJS button styles
						addButton.onclick = () => editor.runCommand('open-fonts');

						typographySection.appendChild(addButton);
						setTimeout(() => {
							if (CKEDITOR) {
								CKEDITOR.dtd.$editable.span = 1;
								CKEDITOR.dtd.$editable.a = 1;
								CKEDITOR.dtd.$editable.strong = 1;
								CKEDITOR.dtd.$editable.b = 1;
								CKEDITOR.dtd.$editable.i = 1;
								CKEDITOR.dtd.$editable.li = 1;
								CKEDITOR.dtd.$editable.ol = 1;
								CKEDITOR.dtd.$editable.ul = 1;
								CKEDITOR.dtd.$editable.small = 1;
								CKEDITOR.dtd.$editable.sup = 1;
								CKEDITOR.dtd.$editable.sub = 1;
								CKEDITOR.dtd.$editable.p = 1;
								CKEDITOR.dtd.$editable.h1 = 1;
								CKEDITOR.dtd.$editable.h2 = 1;
								CKEDITOR.dtd.$editable.h3 = 1;
								CKEDITOR.dtd.$editable.h4 = 1;
								CKEDITOR.dtd.$editable.h5 = 1;
								CKEDITOR.dtd.$editable.h6 = 1;
								CKEDITOR.dtd.$editable.blockquote = 1;
								CKEDITOR.dtd.$editable.hr = 1;
								CKEDITOR.dtd.$editable.br = 1;
								CKEDITOR.dtd.$editable.a = 1;
								CKEDITOR.dtd.$editable.s = 1;
								CKEDITOR.dtd.$editable.b = 1;
								CKEDITOR.dtd.$editable.u = 1;
								CKEDITOR.dtd.$editable.i = 1;
								CKEDITOR.dtd.$editable.em = 1;
							}
						}, 200);
					});
				},
			];

			const pluginsOpts = {
				[gjsBlocksBasic]: {
					flexGrid: true,
					blocks: ['column1', 'column2', 'column3', 'column3-7', 'text', 'link', 'image', 'video'],
				},
				[grapesjsTuiImageEditor]: {
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
				[grapesjsTabs]: {
					tabsBlock: {
						category: 'Extra',
					},
				},
				[grapesjsTyped]: {
					block: {
						category: 'Extra',
						content: {
							type: 'typed',
							'type-speed': 40,
							strings: ['Text row one', 'Text row two', 'Text row three'],
						},
					},
				},
				[grapesjsPresetWebpage]: {
					modalImportTitle: 'Import Template',
					modalImportLabel: '<div style="margin-bottom: 10px; font-size: 13px;">Paste here your HTML/CSS and click Import</div>',
					modalImportContent(editor) {
						return editor.getHtml() + '<style>' + editor.getCss() + '</style>';
					},
				},
				[grapesjsFonts]: {
					api_key: 'AIzaSyBzbSzqgQF3RbtgwFk-3WFsQUrgR7sfPgk',
				},
			};

			editor = grapesjs.init({
				height: '100vh',
				container: '#gjs',
				fromElement: false,
				components: initialValue,
				showOffsets: true,
				assetManager: {
					embedAsBase64: true,
				},
				colorPicker: {appendTo: '#gjs'},
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

			addButtons(editor);
		} catch (error) {
			console.error('Error initializing GrapesJS:', error);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		initializeEditor();
	});

	export function getHtml(fonts, attr = '') {
		let fontServer = 'https://fonts.googleapis.com';
		const preconnect = `<link href="${fontServer}" rel="preconnect" ${attr}><link href="https://fonts.gstatic.com" rel="preconnect" crossorigin ${attr}>`;
		const links = fonts
			.map(f => {
				const prefix = f.variants.length ? ':' : '';
				const variants =
					prefix +
					f.variants
						.map(v => v.replace(/\d+/g, ''))
						.filter(v => !!v)
						.join(',');
				return `<link href="${fontServer}/css?family=${f.name.replace(/ /g, '+')}${variants}&display=swap" rel="stylesheet" ${attr}>`;
			})
			.join('');

		return preconnect + links;
	}
	function parseAndAddFontsFromHTML(html, editor) {
		const importRegex = /@import url\("https:\/\/fonts\.googleapis\.com\/css2\?family=([^&]+)&display=swap"\);/g;

		let match;
		let fonts = [];
		while ((match = importRegex.exec(html)) !== null) {
			const fontFamilyQuery = decodeURIComponent(match[1]);
			const fontFamily = fontFamilyQuery.replace(/\+/g, ' ');

			const font = {
				family: fontFamily,
				category: 'sans-serif', // Defaulting to 'sans-serif' as category is not part of the URL
			};
			fonts.push({name: fontFamily, id: fontFamily, value: `"${font.family}", ${font.category}`, variants: []});
		}

		const model = editor.getModel();
		model.set('fonts', fonts);

		const doc = editor.Canvas.getDocument();
		const fontshtml = getHtml(fonts, 'data-silex-gstatic');
		doc.head.insertAdjacentHTML('beforeend', fontshtml);

		const styleManager = editor.StyleManager;
		const fontProperty = styleManager.getProperty('typography', 'font-family');
		const newFonts = editor.StyleManager.getBuiltIn('font-family').options.concat(fonts);
		fontProperty.setOptions(newFonts.sort((a, b) => a.id.localeCompare(b.id)));
	}

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
				const fonts = editor
					.runCommand('get-fonts-html')
					.replace(
						'<link href="https://fonts.googleapis.com" rel="preconnect" ><link href="https://fonts.gstatic.com" rel="preconnect" crossorigin >',
						''
					)
					.replaceAll('<link href="https://fonts.googleapis.com/css', "@import url('https://fonts.googleapis.com/css2")
					.replaceAll('" rel="stylesheet" >', "');");
				const completeContent = `<style>
					${fonts}
					body {
						color: white;
					}
					${css}
					</style>
                    ${html}`;
				dispatch('post', completeContent);
			},
		});

		editor.Commands.add('cancel-command', {
			run: function (editor, sender) {
				dispatch('cancel', '');
			},
		});

		editor.Commands.add('open-code', {
			codeViewer: null,
			styleViewer: null,
			container: null,

			run(editor) {
				const codeViewer = this.getCodeViewer();
				// const styleViewer = this.getStyleViewer();
				const elementStyle = editor.getSelected().getStyle();
				editor.Modal.open({
					title: 'Edit HTML',
					content: this.getContainer(),
				}).onceClose(() => {
					editor.getSelected().replaceWith(codeViewer.getContent().trim());
					editor.getSelected().setStyle(elementStyle);
					editor.stopCommand('open-code');
				});
				codeViewer.setContent(editor.getSelected().toHTML());
				codeViewer.refresh();
				setTimeout(() => codeViewer.focus(), 0);
			},

			stop() {
				editor.Modal.close();
			},

			getContainer() {
				if (!this.container) {
					const codeViewer = this.getCodeViewer();
					// const styleViewer = this.getStyleViewer();
					const container = document.createElement('div');
					container.className = `import-container`;

					container.appendChild(codeViewer.getElement());
					// container.appendChild(styleViewer.getElement());

					this.container = container;
				}

				return this.container;
			},

			/**
			 * Return the code viewer instance
			 * @returns {CodeViewer}
			 */
			getCodeViewer() {
				if (!this.codeViewer) {
					this.codeViewer = editor.CodeManager.createViewer({
						codeName: 'htmlmixed',
						theme: 'hopscotch',
						readOnly: false,
					});
				}

				return this.codeViewer;
			},

			getStyleViewer() {
				if (!this.styleViewer) {
					this.styleViewer = editor.CodeManager.createViewer({
						codeName: 'htmlmixed',
						theme: 'hopscotch',
						readOnly: false,
					});
				}
				return this.styleViewer;
			},
		});

		// panel.get('buttons').add([
		// 	{
		// 		id: 'open-code-button',
		// 		className: 'fa fa-code',
		// 		command: 'open-code',
		// 		active: false,
		// 		attributes: {title: 'Open Code Editor'},
		// 	},
		// ]);

		editor.CssComposer.addRules(`
		.mobile-only {
			display: none;
		}
		@media screen and (max-width: 767px) {
			.mobile-only {
				display: inherit;
			}
			.desktop-only {
				display: none;
			}
		}
		`);
	}

	localStorage.removeItem('gjs-components');
	localStorage.removeItem('gjs-styles');
	localStorage.removeItem('gjs-html');
	localStorage.removeItem('gjs-css');
	localStorage.removeItem('gjsProject');
</script>

{#if loading}
	<div class="loading">Loading editor...</div>
{/if}
<div id="gjs" class:vertical bind:this={textArea} class:loading />

<style>
	#gjs.vertical {
		max-height: 56em;
	}

	.loading {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		font-size: 1.2em;
		color: #666;
	}

	#gjs.loading {
		opacity: 0;
	}

	:global(.gjs-pn-btn.fa-save) {
		color: green;
	}

	:global(.gjs-pn-btn.fa-times) {
		color: red;
	}

	:global(.gjs-editor) {
		background-color: transparent !important;
	}

	:global(.silex-bar input::placeholder) {
		color: black !important;
		opacity: 1;
	}

	:global(.silex-bar input::-ms-input-placeholder) {
		color: black !important;
	}

	:global(.gjs-layer-vis-on) {
		height: 13px;
	}
	:global(.gjs-layer-vis-off) {
		height: 13px;
	}
	:global(.gjs-layer-caret) {
		height: 15px;
	}
	:global(.gjs-layer-move) {
		height: 15px;
		width: 15px;
	}

	:global(.vertical .gjs-editor) {
		max-height: 70em;
	}

	:global(.vertical .gjs-cv-canvas) {
		width: 100% !important;
		height: calc(50% - var(--gjs-canvas-top)) !important;
		bottom: inherit !important;
	}

	:global(.vertical .gjs-pn-panel.gjs-pn-views-container) {
		height: 400px;
		width: 100%;
		bottom: 0;
		left: 0;
	}

	:global(.vertical .gjs-pn-views) {
		left: 0;
		bottom: 358px;
		width: 100% !important;
	}

	:global(.vertical .gjs-pn-commands) {
		width: 100% !important;
	}

	:global(.vertical .gjs-pn-options) {
		right: 0 !important;
	}

	:global(.cke_notifications_area) {
		display: none;
	}

	:global(.cke_dialog_contents) {
		background-color: #3d3d3d !important;
	}

	:global(.sp-container.gjs-two-color) {
		left: 60% !important;
	}

	:global(.cke_inner) {
		width: 28em !important;
	}

	@media screen and (max-width: 767px) {
		:global(.gjs-cv-canvas) {
			width: 100% !important;
			height: calc(50% - var(--gjs-canvas-top)) !important;
			bottom: inherit !important;
		}

		:global(.gjs-pn-panel.gjs-pn-views-container) {
			height: 400px;
			width: 100%;
			bottom: 0;
			left: 0;
		}

		:global(.gjs-pn-views) {
			left: 0;
			bottom: 358px;
			width: 100% !important;
		}

		:global(.gjs-pn-commands) {
			width: 100% !important;
		}

		:global(.gjs-pn-options) {
			right: 0 !important;
		}
	}
</style>
