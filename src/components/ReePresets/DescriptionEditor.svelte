<script>
	import 'suneditor/dist/css/suneditor.min.css';
	import {getContext} from 'svelte';
	const {open, close} = getContext('simple-modal');
	import suneditor from 'suneditor';
	import plugins from 'suneditor/src/plugins';
	import Button from '../Common/Button.svelte';
	import DesciptionEditor from './DescriptionEditor.svelte';
	import {createEventDispatcher, onMount} from 'svelte';

	export let initialValue = null;
	export let buttonName = 'Post';
	export let fullscreen = false;
	export let fullscreenExit = null;

	const dispatch = createEventDispatcher();

	let textArea;
	let value = initialValue;

	function postComment() {
		dispatch('post', value);
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
			modal = open(DesciptionEditor, {
				initialValue: value,
				fullscreen: true,
				buttonName,
				fullscreenExit: value => {
					close();
					if (value) {
						editor.setContents(value);
					}
				},
			});
		},
	};

	$: editor =
		textArea &&
		suneditor.create(textArea, {
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
				['table', 'link', 'image', 'video' /** 'audio' ,'math' */], // You must add the 'katex' library at options to use the 'math' plugin.
				/** ['imageGallery'] */ // You must add the "imageGalleryUrl".
				fullscreen ? ['showBlocks', 'codeView'] : ['showBlocks', 'codeView', 'customfullscreen'],
				/** ['dir', 'dir_ltr', 'dir_rtl'] */ // "dir": Toggle text direction, "dir_ltr": Right to Left, "dir_rtl": Left to Right
			],
		});
	$: if (editor)
		editor.onChange = function (contents, core) {
			value = contents;
			postComment();
		};
</script>

<div class="post-area">
	<textarea bind:this={textArea}>{initialValue}</textarea>
	{#if fullscreen}
		<Button label="Done" on:click={() => fullscreenExit(value)} />
	{/if}
</div>

<style>
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
