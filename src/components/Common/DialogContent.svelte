<script>
	import {createEventDispatcher} from 'svelte';
	import Button from './Button.svelte';

	const dispatch = createEventDispatcher();

	export let title;
	export let message;
	export let type = 'alert';
	export let okButton = 'Ok';
	export let okButtonType = 'primary';
	export let okButtonDisabled = false;
	export let cancelButton = 'Cancel';
	export let cancelButtonDisabled = false;
	export let deleteButton = 'Delete';
</script>

<header>
	<slot name="header">
		{title}
	</slot>
</header>

<main>
	<slot name="content">
		{#if message && message.length}<p>{message}</p>{/if}
	</slot>
</main>

<footer>
	<slot name="footer">
		<span class="left"
			><slot name="footer-left" />
			{#if type === 'update'}
				<Button label={deleteButton} type="danger" on:click={() => dispatch('delete')} />
			{/if}
		</span>

		<span class="right"
			><slot name="footer-right">
				{#if type === 'alert'}
					<Button label={okButton} type={okButtonType} disabled={okButtonDisabled} on:click={() => dispatch('confirm')} />
				{:else if type === 'confirm' || type === 'update'}
					<Button label={okButton} type={okButtonType} disabled={okButtonDisabled} on:click={() => dispatch('confirm')} />
					<Button label={cancelButton} type="default" disabled={cancelButtonDisabled} on:click={() => dispatch('cancel')} />
				{/if}
			</slot></span>
	</slot>
</footer>

<style>
	header {
		font-size: 1.25em;
		margin-top: 0.4em;
		margin-bottom: 0.8em;
		color: var(--alternate);
	}

	main {
		color: var(--textColor);
		overflow-y: initial;
		flex: 1;
	}

	main::-webkit-scrollbar {
		width: 0.25rem;
	}
	body::-webkit-scrollbar-track {
		background: var(--foreground, #fff);
	}
	main::-webkit-scrollbar-thumb {
		background-color: var(--selected, #3273dc);
		border-radius: 6px;
		border: 3px solid var(--selected, #3273dc);
	}

	footer {
		margin-top: 2em;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	footer .left,
	footer .right {
		display: flex;
		justify-content: flex-start;
		align-items: center;
	}

	footer .right {
		justify-content: flex-end;
	}

	footer :global(.button) {
		margin-right: 0.25em !important;
	}
</style>
