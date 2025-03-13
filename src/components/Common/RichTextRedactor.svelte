<script>
	import 'suneditor/dist/css/suneditor.min.css';
	import {getContext} from 'svelte';
	const {open, close} = getContext('simple-modal');
	import Button from './Button.svelte';
	import RichTextRedactor from './RichTextRedactor.svelte';
	import {createEventDispatcher} from 'svelte';

	export let initialValue = null;
	export let buttonName = 'Post';
	export let cancelButtonName = 'Cancel';
	export let iconFa = 'fas fa-paper-plane';
	export let fullscreen = false;
	export let fullscreenExit = null;

	const dispatch = createEventDispatcher();

	let textArea;
	let value = initialValue;
	let editor;

	const sunEditorImport = () =>
		Promise.all([import('suneditor'), import('suneditor/src/plugins')]).then(([suneditor, plugins]) => ({
			suneditor: suneditor.default,
			plugins: plugins.default,
		}));

	function postComment() {
		dispatch('post', value);
		editor.value = '';
	}

	function onCancel() {
		dispatch('cancel', value);
		editor.value = '';
	}

	let modal;

	var customfullscreen = {
		name: 'customfullscreen',
		display: 'command',
		title: 'Full screen',
		buttonClass: '',
		innerHTML: '<i class="fas fa-up-right-and-down-left-from-center"></i>',

		add: function (core, targetElement) {},
		active: function (element) {
			return fullscreen;
		},
		action: function () {
			modal = open(RichTextRedactor, {
				initialValue: value,
				fullscreen: true,
				buttonName,
				fullscreenExit: value => {
					console.log(value);
					if (value) {
						editor.setContents(value);
					}
					close();
				},
			});
		},
	};
</script>

<div class="post-area">
	<textarea bind:this={textArea}>{initialValue}</textarea>
	{#await sunEditorImport()}
		<div class="loading">Loading editor...</div>
	{:then { suneditor, plugins }}
		{#if textArea}
			{@html ''}
			{#key textArea}
				{(() => {
					editor = suneditor.create(textArea, {
						plugins: {customfullscreen, ...plugins},
						buttonList: [
							['undo', 'redo'],
							['font', 'fontSize', 'formatBlock'],
							['paragraphStyle', 'blockquote'],
							['bold', 'underline', 'italic', 'strike', 'subscript', 'superscript'],
							['fontColor', 'hiliteColor', 'textStyle'],
							['removeFormat'],
							'/', // Line break
							['outdent', 'indent'],
							['align', 'horizontalRule', 'list', 'lineHeight'],
							['table', 'link', 'image', 'video', 'audio' /** ,'math' */], // You must add the 'katex' library at options to use the 'math' plugin.
							/** ['imageGallery'] */ // You must add the "imageGalleryUrl".
							fullscreen ? ['showBlocks', 'codeView'] : ['showBlocks', 'codeView', 'customfullscreen'],
							/** ['dir', 'dir_ltr', 'dir_rtl'] */ // "dir": Toggle text direction, "dir_ltr": Right to Left, "dir_rtl": Left to Right
						],
					});
					editor.onChange = function (contents, core) {
						value = contents;
						if (!buttonName) {
							clearTimeout(autoPostTimer);
							autoPostTimer = setTimeout(() => {
								postComment();
							}, 500);
						}
					};
					return '';
				})()}
			{/key}
		{/if}
	{/await}
	{#if fullscreen}
		<Button label="Done" on:click={() => fullscreenExit(value)} />
	{:else}
		<div class="post-button">
			{#if cancelButtonName}
				<Button label={cancelButtonName} on:click={() => onCancel()} />
			{/if}
			{#if buttonName}
				<Button label={buttonName} type="green" {iconFa} on:click={() => postComment()} />
			{/if}
		</div>
	{/if}
</div>

<style>
	.loading {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 1em;
		color: #666;
	}

	:global(.sun-editor .se-toolbar) {
		background-color: #1a1a1a !important;
	}
	:global(.sun-editor) {
		width: unset !important;
		background-color: unset !important;
	}
	:global(.sun-editor button) {
		color: #fff !important;
	}
	:global(.sun-editor .se-btn-list) {
		color: black !important;
	}

	:global(.sun-editor .se-btn:enabled.on:focus, .sun-editor .se-btn:enabled.on:hover) {
		background-color: #5e5e5e !important;
	}

	:global(.sun-editor .se-btn:hover) {
		background-color: #5e5e5e !important;
	}

	:global(.se-dialog-content) {
		background-color: #5e5e5e !important;
	}

	:global(.se-toolbar-sticky) {
		top: 0 !important;
	}

	:global(.se-toolbar-sticky-dummy) {
		display: none !important;
	}

	.post-button {
		margin-top: 1em;
		display: flex;
		justify-content: end;
		grid-gap: 0.8em;
	}
</style>
