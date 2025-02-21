<script>
	import {Svrollbar} from 'svrollbar';
	import ContentBox from '../Common/ContentBox.svelte';

	export let cls = 'twitterBox';
	export let title = null;

	let scrollContainer;
</script>

<svelte:head>
	<script src="https://cdn.jsdelivr.net/npm/bsky-embed/dist/bsky-embed.es.js" async></script>
</svelte:head>

<ContentBox {cls}>
	{#if title}
		<span class="box-headline">Follow us on <a href="https://bsky.app/profile/beatleader.com">BlueSky</a> to receive updates!</span>
	{/if}
	<div class="darkened-background" bind:this={scrollContainer}>
		<bsky-embed username="beatleader.com" limit="5" load-more="true"> </bsky-embed>
	</div>
	<Svrollbar viewport={scrollContainer} />
</ContentBox>

<style>
	.darkened-background {
		border-radius: 8px;
		max-height: 30em;
		overflow: scroll;
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.darkened-background::-webkit-scrollbar {
		display: none;
	}

	.box-headline {
		font-size: 1.2em;
		padding-bottom: 0.5em;
		padding-top: 0.5em;
		padding-left: 0.1em;
	}

	:global(.twitterBox) {
		border-radius: 12px !important;
		font-size: 0.8em;
		overflow: hidden;
	}

	:global(.twitterBox .v-scrollbar) {
		margin-top: 1.2em !important;
		margin-right: 1.5em !important;
	}
</style>
