<script>
	import {navigate} from 'svelte-routing';
	import {fade} from 'svelte/transition';
	import ssrConfig from '../ssr-config';
	import followed from '../stores/beatleader/followed';
	import ContentBox from '../components/Common/ContentBox.svelte';

	document.body.classList.add('slim');

	let sortBy = '';

	$: console.log($followed);
</script>

<svelte:head>
	<title>Followed - {ssrConfig.name}</title>
</svelte:head>

<article transition:fade>
	<ContentBox>
		<h1 class="title is-3">Followed</h1>
	</ContentBox>
</article>

<style>
</style>
