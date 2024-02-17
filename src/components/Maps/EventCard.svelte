<script>
	import {navigate} from 'svelte-routing';
	import Button from '../Common/Button.svelte';

	export let text;
	export let body;
	export let image;
	export let button = null; // {url: '/event/44', label: 'Event', icon: 'fas fa-rocket'}
</script>

<div class="card" style="--background-url: url({image});">
	<div>
		<h1 class="header">{text}</h1>
		<p class="content">{body}</p>
	</div>
	<div class="right-container">
		{#if button}
			<Button label={button.label} iconFa={button.icon} on:click={() => navigate(button.url)} cls="no-margin" />
		{/if}
	</div>
</div>

<style>
	.card {
		width: 100%;
		padding: 1em;
		border-radius: 12px;
		background: #232323;
		background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.25)), var(--background-url);
		background-position: 50% 21%;
		background-size: 100%;

		box-shadow: 2px 2px 18px 4px rgba(0, 0, 0, 0.25);
		z-index: 3;

		display: flex;
		flex-direction: row;
		justify-content: space-between;
	}

	.header {
		color: #fff;
		font-family: Noto Sans SC;
		font-size: 2em;
		font-style: normal;
		font-weight: 700;
		line-height: normal;
		text-align: left;
		margin-top: -0.25em;
		margin-bottom: 0.33em;
		text-shadow: 2px 2px 4px black;
	}

	.content {
		color: white;
		text-shadow: 2px 2px 4px black;
	}

	.right-container {
		display: flex;
		width: 20%;
		justify-content: center;
		align-items: center;
		margin-right: 0.5em;
	}

	:global(.no-margin) {
		margin: 0 !important;
	}

	@media screen and (max-width: 450px) {
		.header {
			font-size: 1.5em;
		}

		.content {
			font-size: 1em;
		}
	}
</style>
