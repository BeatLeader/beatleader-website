<script>
	import 'suneditor/dist/css/suneditor.min.css';
	import suneditor from 'suneditor';
	import plugins from 'suneditor/src/plugins';
	import Button from '../../Common/Button.svelte';
	import {createEventDispatcher, onMount} from 'svelte';

	export let initialValue = null;
	export let buttonName = 'Post';

	const dispatch = createEventDispatcher();

	let textArea;
	let value;

	function postComment() {
		dispatch('post', value);
		editor.value = '';
	}

	function onCancel() {
		dispatch('cancel', value);
		editor.value = '';
	}

	$: editor =
		textArea &&
		suneditor.create(textArea, {
			plugins: plugins,
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
				['table', 'link', 'image' /** 'video', 'audio' ,'math' */], // You must add the 'katex' library at options to use the 'math' plugin.
				/** ['imageGallery'] */ // You must add the "imageGalleryUrl".
				['showBlocks', 'codeView', 'fullScreen'],
				/** ['dir', 'dir_ltr', 'dir_rtl'] */ // "dir": Toggle text direction, "dir_ltr": Right to Left, "dir_rtl": Left to Right
			],
		});
	$: if (editor)
		editor.onChange = function (contents, core) {
			value = contents;
		};
</script>

<div class="post-area">
	<textarea bind:this={textArea}>{initialValue}</textarea>
	<div class="post-button">
		<Button label="Cancel" on:click={() => onCancel()} />
		<Button label={buttonName} type="green" iconFa="fas fa-paper-plane" on:click={() => postComment()} />
	</div>
</div>

<style>
	:global(.sun-editor .se-toolbar) {
		background-color: #1a1a1a;
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

	.post-button {
		margin-top: 1em;
		display: flex;
		justify-content: end;
		grid-gap: 0.8em;
	}
</style>
